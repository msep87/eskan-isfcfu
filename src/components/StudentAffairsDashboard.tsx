import React, { useState, useMemo, useEffect } from 'react';
import {
  StudentAffairsStaff,
  Student,
  Dormitory,
  Room,
  GuildElection,
  GuildElectionCandidate,
  GuildElectionVote,
  DisciplinaryReferral,
  DisciplinaryReferralStatus,
  SportsProgram,
  SportsProgramType,
  SportsProgramKind,
  SportsProgramStatus,
  SportsRegistration,
  SportsRegistrationStatus,
  DayOfWeek,
} from '../types';
import { Storage } from '../utils/storage';
import { isStudentDormResident } from '../utils/financeUtils';
import {
  exportStudentAffairsDirectoryToExcel,
  exportGuildElectionResultsToExcel,
  exportDisciplinaryReferralsToExcel,
  exportSportsProgramsToExcel,
} from '../utils/excelUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import { SendSecurityReportModal } from './SendSecurityReportModal';
import {
  Award,
  Users,
  Search,
  FileSpreadsheet,
  Printer,
  Vote,
  Shield,
  ShieldAlert,
  Plus,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Clock,
  Lock,
  Unlock,
  MessageSquare,
  BookOpen,
  Trash2,
  UserCheck,
  Bell,
  Calendar,
  Dumbbell,
  Activity,
  Edit3,
  MapPin,
} from 'lucide-react';

interface StudentAffairsDashboardProps {
  staff: StudentAffairsStaff;
  students: Student[];
  dorms: Dormitory[];
  rooms: Room[];
  cloudSyncTick?: number;
  onRefreshData: () => void;
  onOpenReports: () => void;
  onOpenMessages: () => void;
  onOpenChangePassword: () => void;
  onOpenUserGuide?: (role: 'student_affairs') => void;
  embeddedMode?: boolean;
}

const SPORT_TYPE_LABELS: Record<SportsProgramType, string> = {
  futsal: 'فوتسال',
  volleyball: 'والیبال',
  basketball: 'بسکتبال',
  table_tennis: 'تنیس روی میز',
  badminton: 'بدمینتون',
  chess: 'شطرنج',
  track_field: 'دو و میدانی',
  swimming: 'شنا',
  fitness_morning: 'ورزش صبحگاهی و همگانی',
  hiking: 'کوهپیمایی و طبیعت‌گردی',
  martial_arts: 'ورزش‌های رزمی',
  other: 'سایر رشته‌های ورزشی',
};

const SPORT_KIND_LABELS: Record<SportsProgramKind, { label: string; cls: string }> = {
  training: {
    label: 'کلاس / تمرین آموزشی',
    cls: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300',
  },
  tournament: {
    label: 'مسابقه / المپیاد درون‌دانشگاهی',
    cls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
  },
  recreation: {
    label: 'اردو / برنامه تفریحی',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  morning_exercise: {
    label: 'ورزش صبحگاهی و نشاط همگانی',
    cls: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300',
  },
};

const SPORT_STATUS_LABELS: Record<SportsProgramStatus, { label: string; cls: string }> = {
  planned: {
    label: 'برنامه‌ریزی‌شده (پیش‌ثبت‌نام)',
    cls: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  },
  registration_open: {
    label: 'ثبت‌نام باز',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  ongoing: {
    label: 'در حال برگزاری',
    cls: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300',
  },
  completed: {
    label: 'پایان‌یافته / برگزارشده',
    cls: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
  cancelled: {
    label: 'لغوشده',
    cls: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300',
  },
};

const DAY_OF_WEEK_LABELS: Record<DayOfWeek | 'multiple', string> = {
  saturday: 'شنبه',
  sunday: 'یکشنبه',
  monday: 'دوشنبه',
  tuesday: 'سه‌شنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنج‌شنبه',
  friday: 'جمعه',
  multiple: 'چند روز در هفته',
};

const GENDER_SCOPE_LABELS: Record<'all' | 'brothers' | 'sisters', string> = {
  all: 'عمومی (برادران و خواهران)',
  brothers: 'ویژه برادران',
  sisters: 'ویژه خواهران',
};

const DISC_STATUS_LABELS: Record<DisciplinaryReferralStatus, { label: string; cls: string }> = {
  pending_review: {
    label: 'در انتظار بررسی شورا',
    cls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
  },
  session_scheduled: {
    label: 'تعیین وقت جلسه شورا',
    cls: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300',
  },
  verdict_issued: {
    label: 'صدور رأی شورا',
    cls: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300',
  },
  closed: {
    label: 'مختومه‌شده',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
};

export const StudentAffairsDashboard: React.FC<StudentAffairsDashboardProps> = ({
  staff,
  students,
  dorms,
  rooms,
  cloudSyncTick,
  onRefreshData,
  onOpenReports,
  onOpenMessages,
  onOpenChangePassword,
  onOpenUserGuide,
  embeddedMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'sports' | 'elections' | 'disciplinary'>('students');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isSendSecurityModalOpen, setIsSendSecurityModalOpen] = useState(false);

  // ۱. تب دانشجویان خوابگاهی و ترددی
  const [residencyFilter, setResidencyFilter] = useState<'all' | 'dorm' | 'commuter'>('all');
  const [dormFilter, setDormFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // ۱.۵ تب برنامه‌ریزی ورزشی و تربیت بدنی
  const [sportsPrograms, setSportsPrograms] = useState<SportsProgram[]>(() =>
    Storage.getSportsPrograms()
  );
  const [sportsRegistrations, setSportsRegistrations] = useState<SportsRegistration[]>(() =>
    Storage.getSportsRegistrations()
  );
  const [spSearch, setSpSearch] = useState('');
  const [spTypeFilter, setSpTypeFilter] = useState<string>('all');
  const [spKindFilter, setSpKindFilter] = useState<string>('all');
  const [spStatusFilter, setSpStatusFilter] = useState<string>('all');
  const [isSportsModalOpen, setIsSportsModalOpen] = useState(false);
  const [editingSportProgram, setEditingSportProgram] = useState<SportsProgram | null>(null);
  const [spTitle, setSpTitle] = useState('');
  const [spType, setSpType] = useState<SportsProgramType>('futsal');
  const [spKind, setSpKind] = useState<SportsProgramKind>('training');
  const [spGenderScope, setSpGenderScope] = useState<'all' | 'brothers' | 'sisters'>('all');
  const [spDormId, setSpDormId] = useState<string>('all');
  const [spDayOfWeek, setSpDayOfWeek] = useState<DayOfWeek | 'multiple'>('saturday');
  const [spScheduleDate, setSpScheduleDate] = useState(() => new Date().toLocaleDateString('fa-IR'));
  const [spStartTime, setSpStartTime] = useState('۱۶:۰۰');
  const [spEndTime, setSpEndTime] = useState('۱۸:۰۰');
  const [spVenue, setSpVenue] = useState('سالن ورزشی چندمنظوره پردیس');
  const [spCoachName, setSpCoachName] = useState('');
  const [spMaxCapacity, setSpMaxCapacity] = useState('24');
  const [spEligibility, setSpEligibility] = useState('کلیه دانشجومعلمان خوابگاهی و ترددی');
  const [spEquipment, setSpEquipment] = useState('لباس و کفش ورزشی مناسب');
  const [spDescription, setSpDescription] = useState('');
  const [spStatus, setSpStatus] = useState<SportsProgramStatus>('registration_open');
  const [spPublishNow, setSpPublishNow] = useState(true);
  const [managingRegsProgramId, setManagingRegsProgramId] = useState<string | null>(null);
  const [confirmDeleteSportProgram, setConfirmDeleteSportProgram] = useState<SportsProgram | null>(
    null
  );

  // ۲. تب انتخابات شورای صنفی
  const [elections, setElections] = useState<GuildElection[]>(() => Storage.getGuildElections());
  const [votes, setVotes] = useState<GuildElectionVote[]>(() => Storage.getGuildElectionVotes());
  const [isElectionModalOpen, setIsElectionModalOpen] = useState(false);
  const [elTitle, setElTitle] = useState('');
  const [elDesc, setElDesc] = useState('');
  const [elNotice, setElNotice] = useState('');
  const [elEligibility, setElEligibility] = useState<'all_students' | 'dorm_only'>('all_students');
  const [elMaxSelections, setElMaxSelections] = useState('3');
  const [elStartDate, setElStartDate] = useState(() => new Date().toLocaleDateString('fa-IR'));
  const [elEndDate, setElEndDate] = useState(() => new Date().toLocaleDateString('fa-IR'));
  const [elStartTime, setElStartTime] = useState('۰۸:۰۰');
  const [elEndTime, setElEndTime] = useState('۲۲:۰۰');
  const [elActivateNow, setElActivateNow] = useState(true);
  const [elCandidates, setElCandidates] = useState<GuildElectionCandidate[]>([]);
  const [candSearch, setCandSearch] = useState('');
  const [manualCandName, setManualCandName] = useState('');
  const [manualCandField, setManualCandField] = useState('');
  const [manualCandSlogan, setManualCandSlogan] = useState('');

  // ۳. تب پرونده‌های ارجاعی شورای انضباطی
  const [referrals, setReferrals] = useState<DisciplinaryReferral[]>(() =>
    Storage.getDisciplinaryReferrals()
  );
  const [discStatusFilter, setDiscStatusFilter] = useState<string>('all');
  const [discSearch, setDiscSearch] = useState('');
  const [editingReferral, setEditingReferral] = useState<DisciplinaryReferral | null>(null);
  const [refStatus, setRefStatus] = useState<DisciplinaryReferralStatus>('session_scheduled');
  const [refSessionDate, setRefSessionDate] = useState('');
  const [refSessionTime, setRefSessionTime] = useState('');
  const [refSessionLoc, setRefSessionLoc] = useState('دفتر امور دانشجویی و شورای انضباطی');
  const [refVerdict, setRefVerdict] = useState('');
  const [refNotes, setRefNotes] = useState('');
  const [refNotifyStudent, setRefNotifyStudent] = useState(true);

  useEffect(() => {
    setElections(Storage.getGuildElections());
    setVotes(Storage.getGuildElectionVotes());
    setReferrals(Storage.getDisciplinaryReferrals());
    setSportsPrograms(Storage.getSportsPrograms());
    setSportsRegistrations(Storage.getSportsRegistrations());
  }, [cloudSyncTick]);

  const reloadLocal = () => {
    setElections(Storage.getGuildElections());
    setVotes(Storage.getGuildElectionVotes());
    setReferrals(Storage.getDisciplinaryReferrals());
    setSportsPrograms(Storage.getSportsPrograms());
    setSportsRegistrations(Storage.getSportsRegistrations());
    onRefreshData();
  };

  const dormStudentsCount = useMemo(
    () => students.filter((s) => isStudentDormResident(s)).length,
    [students]
  );
  const commuterStudentsCount = students.length - dormStudentsCount;

  const uniqueFields = useMemo(
    () => Array.from(new Set(students.map((s) => s.fieldOfStudy).filter(Boolean))).sort(),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const resident = isStudentDormResident(s);
      if (residencyFilter === 'dorm' && !resident) return false;
      if (residencyFilter === 'commuter' && resident) return false;
      if (dormFilter !== 'all' && s.assignedDormId !== dormFilter) return false;
      if (fieldFilter !== 'all' && s.fieldOfStudy !== fieldFilter) return false;
      if (q) {
        const hay = `${s.fullName} ${s.studentId} ${s.nationalId} ${s.fieldOfStudy} ${s.province} ${s.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [students, residencyFilter, dormFilter, fieldFilter, searchQuery]);

  const filteredReferrals = useMemo(() => {
    const q = discSearch.trim().toLowerCase();
    return referrals.filter((r) => {
      if (discStatusFilter !== 'all' && r.status !== discStatusFilter) return false;
      if (q) {
        const hay = `${r.studentName} ${r.studentId} ${r.referralCode} ${r.violationLabel} ${r.referredByName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [referrals, discStatusFilter, discSearch]);

  const pendingReferralsCount = useMemo(
    () => referrals.filter((r) => r.status === 'pending_review').length,
    [referrals]
  );

  const filteredSportsPrograms = useMemo(() => {
    const q = spSearch.trim().toLowerCase();
    return sportsPrograms.filter((p) => {
      if (spTypeFilter !== 'all' && p.sportType !== spTypeFilter) return false;
      if (spKindFilter !== 'all' && p.programKind !== spKindFilter) return false;
      if (spStatusFilter !== 'all' && p.status !== spStatusFilter) return false;
      if (q) {
        const hay = `${p.title} ${p.programCode} ${p.venue} ${p.coachName || ''} ${p.dormName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sportsPrograms, spSearch, spTypeFilter, spKindFilter, spStatusFilter]);

  const activeSportsRegsCount = useMemo(
    () => sportsRegistrations.filter((r) => r.status !== 'cancelled').length,
    [sportsRegistrations]
  );

  const openNewSportModal = () => {
    setEditingSportProgram(null);
    setSpTitle('');
    setSpType('futsal');
    setSpKind('training');
    setSpGenderScope('all');
    setSpDormId('all');
    setSpDayOfWeek('saturday');
    setSpScheduleDate(new Date().toLocaleDateString('fa-IR'));
    setSpStartTime('۱۶:۰۰');
    setSpEndTime('۱۸:۰۰');
    setSpVenue('سالن ورزشی چندمنظوره پردیس');
    setSpCoachName('');
    setSpMaxCapacity('24');
    setSpEligibility('کلیه دانشجومعلمان خوابگاهی و ترددی');
    setSpEquipment('لباس و کفش ورزشی مناسب');
    setSpDescription('');
    setSpStatus('registration_open');
    setSpPublishNow(true);
    setIsSportsModalOpen(true);
  };

  const openEditSportModal = (p: SportsProgram) => {
    setEditingSportProgram(p);
    setSpTitle(p.title);
    setSpType(p.sportType);
    setSpKind(p.programKind);
    setSpGenderScope(p.genderScope);
    setSpDormId(p.dormId || 'all');
    setSpDayOfWeek(p.dayOfWeek || 'saturday');
    setSpScheduleDate(p.scheduleDate || '');
    setSpStartTime(p.startTime);
    setSpEndTime(p.endTime);
    setSpVenue(p.venue);
    setSpCoachName(p.coachName || '');
    setSpMaxCapacity(p.maxCapacity ? String(p.maxCapacity) : '');
    setSpEligibility(p.eligibility || '');
    setSpEquipment(p.equipmentNeeded || '');
    setSpDescription(p.description || '');
    setSpStatus(p.status);
    setSpPublishNow(p.isPublishedToStudents);
    setIsSportsModalOpen(true);
  };

  const handleSaveSportProgram = (e: React.FormEvent) => {
    e.preventDefault();
    const dormName =
      spDormId === 'all'
        ? 'کلیه سراها و پردیس'
        : dorms.find((d) => d.id === spDormId)?.name || 'سرای منتخب';
    const parsedCap = Number(spMaxCapacity);
    const maxCapacity = Number.isFinite(parsedCap) && parsedCap > 0 ? Math.floor(parsedCap) : undefined;

    if (editingSportProgram) {
      const res = Storage.updateSportsProgram(
        editingSportProgram.id,
        {
          title: spTitle.trim(),
          sportType: spType,
          programKind: spKind,
          genderScope: spGenderScope,
          dormId: spDormId,
          dormName,
          dayOfWeek: spDayOfWeek,
          scheduleDate: spScheduleDate.trim() || undefined,
          startTime: spStartTime.trim() || '۱۶:۰۰',
          endTime: spEndTime.trim() || '۱۸:۰۰',
          venue: spVenue.trim(),
          coachName: spCoachName.trim() || undefined,
          maxCapacity,
          eligibility: spEligibility.trim() || undefined,
          equipmentNeeded: spEquipment.trim() || undefined,
          description: spDescription.trim() || undefined,
          status: spStatus,
          isPublishedToStudents: spPublishNow,
        },
        staff.fullName
      );
      setFeedback({ ok: res.success, msg: res.message });
      if (res.success) {
        setIsSportsModalOpen(false);
        setEditingSportProgram(null);
        reloadLocal();
      }
    } else {
      const res = Storage.addSportsProgram({
        title: spTitle.trim(),
        sportType: spType,
        programKind: spKind,
        genderScope: spGenderScope,
        dormId: spDormId,
        dormName,
        dayOfWeek: spDayOfWeek,
        scheduleDate: spScheduleDate.trim() || undefined,
        startTime: spStartTime.trim() || '۱۶:۰۰',
        endTime: spEndTime.trim() || '۱۸:۰۰',
        venue: spVenue.trim(),
        coachName: spCoachName.trim() || undefined,
        maxCapacity,
        eligibility: spEligibility.trim() || undefined,
        equipmentNeeded: spEquipment.trim() || undefined,
        description: spDescription.trim() || undefined,
        status: spStatus,
        isPublishedToStudents: spPublishNow,
        createdById: staff.id,
        createdByName: staff.fullName,
      });
      setFeedback({ ok: res.success, msg: res.message });
      if (res.success) {
        setIsSportsModalOpen(false);
        reloadLocal();
      }
    }
  };

  const handleToggleSportPublish = (p: SportsProgram) => {
    const res = Storage.toggleSportsProgramPublish(p.id, !p.isPublishedToStudents, staff.fullName);
    setFeedback({
      ok: res.success,
      msg: !p.isPublishedToStudents
        ? `برنامه ورزشی «${p.title}» در کارتابل دانشجویان منتشر شد.`
        : `انتشار برنامه «${p.title}» موقتاً متوقف (پیش‌نویس) شد.`,
    });
    reloadLocal();
  };

  const handleConfirmDeleteSport = () => {
    if (!confirmDeleteSportProgram) return;
    const res = Storage.deleteSportsProgram(confirmDeleteSportProgram.id);
    setFeedback({ ok: res.success, msg: res.message });
    setConfirmDeleteSportProgram(null);
    reloadLocal();
  };

  const handleUpdateRegStatus = (regId: string, status: SportsRegistrationStatus) => {
    const res = Storage.updateSportsRegistrationStatus(regId, status);
    setFeedback({ ok: res.success, msg: res.message });
    reloadLocal();
  };

  const addCandidateFromStudent = (s: Student) => {
    if (elCandidates.some((c) => c.studentId === s.studentId)) return;
    setElCandidates((prev) => [
      ...prev,
      {
        id: `cand_${s.studentId}_${Date.now()}`,
        studentId: s.studentId,
        fullName: s.fullName,
        fieldOfStudy: s.fieldOfStudy,
        entryTerm: s.entryTerm,
        dormName:
          dorms.find((d) => d.id === s.assignedDormId)?.name || s.assignedDormName || 'ترددی',
        photoUrl: s.photoUrl,
      },
    ]);
  };

  const addManualCandidate = () => {
    if (!manualCandName.trim()) return;
    setElCandidates((prev) => [
      ...prev,
      {
        id: `cand_man_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fullName: manualCandName.trim(),
        fieldOfStudy: manualCandField.trim() || undefined,
        slogan: manualCandSlogan.trim() || undefined,
      },
    ]);
    setManualCandName('');
    setManualCandField('');
    setManualCandSlogan('');
  };

  const handleCreateElection = (e: React.FormEvent) => {
    e.preventDefault();
    const maxSel = Math.max(1, Number(elMaxSelections) || 1);
    const settings = Storage.getSettings();
    const res = Storage.addGuildElection({
      title: elTitle.trim(),
      description: elDesc.trim() || undefined,
      noticeText:
        elNotice.trim() ||
        'به اطلاع دانشجومعلمان گرامی می‌رساند رأی‌گیری انتخابات شورای صنفی در بازه اعلامی فعال است.',
      academicYear: settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶',
      semester: settings.currentSemester || 'نیمسال اول',
      targetEligibility: elEligibility,
      maxSelections: maxSel,
      startDate: elStartDate.trim(),
      endDate: elEndDate.trim(),
      startTime: elStartTime.trim(),
      endTime: elEndTime.trim(),
      isActiveWindow: elActivateNow,
      candidates: elCandidates,
      createdById: staff.id,
      createdByName: staff.fullName,
    });

    if (res.success && res.election && elActivateNow) {
      Storage.toggleGuildElectionWindow(res.election.id, true, staff.fullName, true);
    }

    setFeedback({ ok: res.success, msg: res.message });
    if (res.success) {
      setIsElectionModalOpen(false);
      setElTitle('');
      setElDesc('');
      setElNotice('');
      setElCandidates([]);
      reloadLocal();
    }
  };

  const handleToggleWindow = (election: GuildElection, nextActive: boolean) => {
    const res = Storage.toggleGuildElectionWindow(
      election.id,
      nextActive,
      staff.fullName,
      nextActive
    );
    setFeedback({ ok: res.success, msg: res.message });
    reloadLocal();
  };

  const openReferralEditor = (ref: DisciplinaryReferral) => {
    setEditingReferral(ref);
    setRefStatus(ref.status === 'pending_review' ? 'session_scheduled' : ref.status);
    setRefSessionDate(ref.sessionDate || new Date().toLocaleDateString('fa-IR'));
    setRefSessionTime(ref.sessionTime || '۱۰:۰۰');
    setRefSessionLoc(ref.sessionLocation || 'دفتر امور دانشجویی و شورای انضباطی');
    setRefVerdict(ref.verdict || '');
    setRefNotes(ref.councilNotes || '');
    setRefNotifyStudent(true);
  };

  const handleSaveReferralUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReferral) return;
    const res = Storage.updateDisciplinaryReferral(
      editingReferral.id,
      {
        status: refStatus,
        sessionDate: refSessionDate.trim() || undefined,
        sessionTime: refSessionTime.trim() || undefined,
        sessionLocation: refSessionLoc.trim() || undefined,
        verdict: refVerdict.trim() || undefined,
        councilNotes: refNotes.trim() || undefined,
      },
      staff.fullName,
      refNotifyStudent
    );
    setFeedback({ ok: res.success, msg: res.message });
    setEditingReferral(null);
    reloadLocal();
  };

  const handlePrintDirectory = () => {
    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>گزارش دانشجویان خوابگاهی و ترددی</title>
  <style>
    @page { size: A4 landscape; margin: 1.2cm; }
    body { font-family: Vazirmatn, Tahoma, sans-serif; direction: rtl; font-size: 8.5pt; color: #0f172a; }
    h1 { color: #0e7490; font-size: 13pt; text-align: center; margin: 0 0 6px 0; }
    .meta { text-align: center; font-size: 8pt; color: #475569; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0e7490; color: #fff; padding: 5px; border: 1px solid #0e7490; }
    td { padding: 4px 5px; border: 1px solid #cbd5e1; }
    tr:nth-child(even) td { background: #ecfeff; }
  </style>
</head>
<body>
  <h1>فهرست دانشجویان خوابگاهی و ترددی — اداره امور دانشجویی و تربیت بدنی</h1>
  <div class="meta">تعداد کل ردیف‌ها: ${filteredStudents.length} • تاریخ چاپ: ${escapeHtml(
      new Date().toLocaleDateString('fa-IR')
    )}</div>
  <table>
    <thead><tr><th>#</th><th>نام و نام خانوادگی</th><th>کد دانشجویی</th><th>کد ملی</th><th>نوع اسکان</th><th>سرا و اتاق</th><th>رشته</th><th>ورودی</th><th>موبایل</th><th>استان / شهر</th></tr></thead>
    <tbody>
      ${filteredStudents
        .slice(0, 500)
        .map((s, i) => {
          const res = isStudentDormResident(s);
          const dorm = dorms.find((d) => d.id === s.assignedDormId);
          const room = rooms.find((r) => r.id === s.assignedRoomId);
          return `<tr><td>${i + 1}</td><td>${escapeHtml(s.fullName)}</td><td>${escapeHtml(
            s.studentId
          )}</td><td>${escapeHtml(s.nationalId)}</td><td>${res ? 'خوابگاهی' : 'ترددی'}</td><td>${
            dorm ? `${escapeHtml(dorm.name)} - ${escapeHtml(room?.roomNumber || '-')}` : '-'
          }</td><td>${escapeHtml(s.fieldOfStudy)}</td><td>${escapeHtml(
            s.entryTerm
          )}</td><td>${escapeHtml(s.mobile || s.phone || '-')}</td><td>${escapeHtml(
            s.province
          )} / ${escapeHtml(s.city)}</td></tr>`;
        })
        .join('')}
    </tbody>
  </table>
</body>
</html>`;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    const cleanup = () => window.setTimeout(() => iframe.remove(), 1000);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        window.setTimeout(cleanup, 60000);
      }
    };
    iframe.srcdoc = html;
  };

  const printHtmlViaIframe = (html: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    const cleanup = () => window.setTimeout(() => iframe.remove(), 1000);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        window.setTimeout(cleanup, 60000);
      }
    };
    iframe.srcdoc = html;
  };

  const handlePrintSportsSchedule = () => {
    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>تقویم و برنامه‌های ورزشی و تربیت بدنی</title>
  <style>
    @page { size: A4 landscape; margin: 1.2cm; }
    body { font-family: Vazirmatn, Tahoma, sans-serif; direction: rtl; font-size: 8.5pt; color: #0f172a; }
    h1 { color: #047857; font-size: 13pt; text-align: center; margin: 0 0 6px 0; }
    .meta { text-align: center; font-size: 8pt; color: #475569; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #047857; color: #fff; padding: 6px; border: 1px solid #047857; }
    td { padding: 5px; border: 1px solid #cbd5e1; }
    tr:nth-child(even) td { background: #ecfdf5; }
  </style>
</head>
<body>
  <h1>تقویم جامع برنامه‌های ورزشی و تربیت بدنی — دانشگاه فرهنگیان استان اصفهان</h1>
  <div class="meta">تعداد برنامه‌ها: ${filteredSportsPrograms.length} • تاریخ چاپ: ${escapeHtml(
      new Date().toLocaleDateString('fa-IR')
    )}</div>
  <table>
    <thead>
      <tr>
        <th>کد</th><th>عنوان برنامه</th><th>رشته</th><th>نوع</th><th>سرا / محدوده</th><th>جنسیت</th><th>زمان و روز</th><th>مکان / سالن</th><th>مربی</th><th>ثبت‌نام / ظرفیت</th><th>وضعیت</th>
      </tr>
    </thead>
    <tbody>
      ${filteredSportsPrograms
        .map((p) => {
          const activeCount = sportsRegistrations.filter(
            (r) => r.programId === p.id && r.status !== 'cancelled'
          ).length;
          const dayLabel = p.dayOfWeek ? DAY_OF_WEEK_LABELS[p.dayOfWeek] : '';
          return `<tr>
            <td>${escapeHtml(p.programCode)}</td>
            <td><strong>${escapeHtml(p.title)}</strong></td>
            <td>${escapeHtml(SPORT_TYPE_LABELS[p.sportType])}</td>
            <td>${escapeHtml(SPORT_KIND_LABELS[p.programKind].label)}</td>
            <td>${escapeHtml(p.dormName)}</td>
            <td>${escapeHtml(GENDER_SCOPE_LABELS[p.genderScope])}</td>
            <td>${escapeHtml([dayLabel, p.scheduleDate, `${p.startTime} تا ${p.endTime}`].filter(Boolean).join(' • '))}</td>
            <td>${escapeHtml(p.venue)}</td>
            <td>${escapeHtml(p.coachName || '-')}</td>
            <td>${activeCount} / ${p.maxCapacity ? p.maxCapacity : 'نامحدود'}</td>
            <td>${escapeHtml(SPORT_STATUS_LABELS[p.status].label)}</td>
          </tr>`;
        })
        .join('')}
    </tbody>
  </table>
</body>
</html>`;
    printHtmlViaIframe(html);
  };

  const handlePrintProgramRoster = (prog: SportsProgram) => {
    const regs = sportsRegistrations.filter((r) => r.programId === prog.id && r.status !== 'cancelled');
    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>لیست حضور و غیاب برنامه ورزشی ${escapeHtml(prog.title)}</title>
  <style>
    @page { size: A4 portrait; margin: 1.3cm; }
    body { font-family: Vazirmatn, Tahoma, sans-serif; direction: rtl; font-size: 9pt; color: #0f172a; }
    h1 { color: #0f766e; font-size: 12.5pt; text-align: center; margin: 0 0 6px 0; }
    .meta { text-align: center; font-size: 8.5pt; color: #475569; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0f766e; color: #fff; padding: 6px; border: 1px solid #0f766e; }
    td { padding: 5px; border: 1px solid #cbd5e1; }
    tr:nth-child(even) td { background: #f0fdfa; }
  </style>
</head>
<body>
  <h1>فهرست شرکت‌کنندگان و حضور و غیاب — ${escapeHtml(prog.title)} (${escapeHtml(prog.programCode)})</h1>
  <div class="meta">
    رشته: ${escapeHtml(SPORT_TYPE_LABELS[prog.sportType])} • مکان: ${escapeHtml(prog.venue)} • ساعت: ${escapeHtml(prog.startTime)} تا ${escapeHtml(prog.endTime)} • مربی: ${escapeHtml(prog.coachName || '-')}
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>نام و نام خانوادگی</th><th>کد دانشجویی</th><th>سرا / اتاق</th><th>سطح</th><th>شماره تماس</th><th>وضعیت</th><th>امضا</th></tr>
    </thead>
    <tbody>
      ${
        regs.length > 0
          ? regs
              .map(
                (r, idx) => `<tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(r.studentName)}</td>
          <td>${escapeHtml(r.studentId)}</td>
          <td>${r.dormName ? `${escapeHtml(r.dormName)}${r.roomNumber ? ` (${escapeHtml(r.roomNumber)})` : ''}` : 'ترددی'}</td>
          <td>${r.skillLevel === 'advanced' ? 'حرفه‌ای' : r.skillLevel === 'intermediate' ? 'متوسط' : 'مبتدی'}</td>
          <td>${escapeHtml(r.studentMobile || '-')}</td>
          <td>${r.status === 'attended' ? 'حاضر' : 'ثبت‌نام‌شده'}</td>
          <td></td>
        </tr>`
              )
              .join('')
          : '<tr><td colspan="8" style="text-align:center;">هنوز دانشجویی ثبت‌نام نکرده است.</td></tr>'
      }
    </tbody>
  </table>
</body>
</html>`;
    printHtmlViaIframe(html);
  };

  const StudentAffairsHeaderVars = !embeddedMode;
  return (
    <div className="space-y-6">
      {/* سربرگ امور دانشجویی و تربیت بدنی */}
      {StudentAffairsHeaderVars && (
      <div className="bg-gradient-to-r from-cyan-800 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-14 -left-14 w-52 h-52 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Award className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-cyan-100 text-[11px] font-bold mb-1">
                {staff.department || 'اداره امور دانشجویی، تربیت بدنی و رفاهی'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black">
                کارتابل امور دانشجویی، تربیت بدنی، شورای صنفی و شورای انضباطی
              </h2>
              <p className="text-xs text-cyan-100/90 mt-1">
                خوش آمدید {staff.fullName} • دسترسی جامع به دانشجویان خوابگاهی و ترددی، انتخابات و پرونده‌های ارجاعی شورا
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenReports}
              className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>گزارش‌های جامع</span>
            </button>

            <button
              onClick={onOpenMessages}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>پیام‌رسان</span>
            </button>

            <button
              onClick={() => setIsSendSecurityModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-900/75 hover:bg-slate-900 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="ارسال گزارش مستقیم برای یک یا چند دانشجو به واحد حراست و انتظامات"
            >
              <Shield className="w-4 h-4" />
              <span>گزارش به حراست</span>
            </button>

            <button
              onClick={onOpenChangePassword}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>تغییر رمز</span>
            </button>

            {onOpenUserGuide && (
              <button
                onClick={() => onOpenUserGuide('student_affairs')}
                className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>راهنما</span>
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500">کل دانشجویان</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
            {students.length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500">دانشجویان خوابگاهی</span>
          <div className="text-2xl font-black text-teal-600 mt-1 tabular-nums">
            {dormStudentsCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500">دانشجویان ترددی</span>
          <div className="text-2xl font-black text-sky-600 mt-1 tabular-nums">
            {commuterStudentsCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500">برنامه‌های ورزشی فعال</span>
          <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
            {sportsPrograms.filter((p) => p.status !== 'cancelled' && p.status !== 'completed').length}
            <span className="text-xs font-bold text-slate-400 mr-1.5">
              ({activeSportsRegsCount} ثبت‌نام)
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500">انتخابات فعال شورای صنفی</span>
          <div className="text-2xl font-black text-indigo-600 mt-1 tabular-nums">
            {elections.filter((e) => e.isActiveWindow).length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500">ارجاعات شورای انضباطی</span>
          <div className="text-2xl font-black text-rose-600 mt-1 tabular-nums">
            {referrals.length}
            {pendingReferralsCount > 0 && (
              <span className="text-xs font-bold text-amber-600 mr-2">
                ({pendingReferralsCount} جدید)
              </span>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold border ${
            feedback.ok
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200'
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* تب‌های اصلی */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'students'
              ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>دانشجویان خوابگاهی و ترددی ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sports')}
          className={`flex-1 min-w-[190px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'sports'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>برنامه‌ریزی ورزشی و تربیت بدنی ({sportsPrograms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('elections')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'elections'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>انتخابات شورای صنفی ({elections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('disciplinary')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'disciplinary'
              ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>پرونده‌های شورای انضباطی</span>
          {pendingReferralsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
              {pendingReferralsCount}
            </span>
          )}
        </button>
      </div>

      {/* تب ۱: دانشجویان خوابگاهی و ترددی + گزارش‌گیری */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[220px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو بر اساس نام، شماره دانشجویی، کد ملی، رشته یا شهر..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <select
                  value={residencyFilter}
                  onChange={(e) =>
                    setResidencyFilter(e.target.value as 'all' | 'dorm' | 'commuter')
                  }
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="all">همه (خوابگاهی و ترددی)</option>
                  <option value="dorm">فقط دانشجویان خوابگاهی</option>
                  <option value="commuter">فقط دانشجویان ترددی</option>
                </select>

                <select
                  value={dormFilter}
                  onChange={(e) => setDormFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="all">همه سراها</option>
                  {dorms.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={fieldFilter}
                  onChange={(e) => setFieldFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="all">همه رشته‌ها</option>
                  {uniqueFields.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    exportStudentAffairsDirectoryToExcel(
                      filteredStudents,
                      dorms,
                      rooms,
                      residencyFilter === 'dorm'
                        ? 'خوابگاهی'
                        : residencyFilter === 'commuter'
                        ? 'ترددی'
                        : 'خوابگاهی_و_ترددی'
                    )
                  }
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>خروجی اکسل ({filteredStudents.length})</span>
                </button>
                <button
                  onClick={handlePrintDirectory}
                  className="px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ / PDF</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">نام و نام خانوادگی</th>
                  <th className="p-3">کد دانشجویی</th>
                  <th className="p-3">وضعیت اسکان</th>
                  <th className="p-3">سرا / اتاق</th>
                  <th className="p-3">رشته و ورودی</th>
                  <th className="p-3">موبایل</th>
                  <th className="p-3">استان / شهر</th>
                  <th className="p-3 text-center">مشاهده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.slice(0, 200).map((s, idx) => {
                  const resident = isStudentDormResident(s);
                  const dorm = dorms.find((d) => d.id === s.assignedDormId);
                  const room = rooms.find((r) => r.id === s.assignedRoomId);
                  return (
                    <tr
                      key={s.studentId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="p-3 tabular-nums text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{s.fullName}</td>
                      <td className="p-3 font-mono">{s.studentId}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            resident
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                          }`}
                        >
                          {resident ? 'خوابگاهی' : 'ترددی'}
                        </span>
                      </td>
                      <td className="p-3">
                        {dorm ? `${dorm.name} - اتاق ${room?.roomNumber || s.assignedRoomNumber || '-'}` : '-'}
                      </td>
                      <td className="p-3">
                        {s.fieldOfStudy} ({s.entryTerm})
                      </td>
                      <td className="p-3 font-mono">{s.mobile || s.phone || '-'}</td>
                      <td className="p-3">
                        {s.province} / {s.city}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>پرونده</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredStudents.length > 200 && (
              <div className="p-3 text-center text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                نمایش ۲۰۰ ردیف اول در جدول مرورگر؛ برای دریافت کل {filteredStudents.length} ردیف از دکمه «خروجی اکسل» استفاده فرمایید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* تب ۲: انتخابات شورای صنفی */}
      {activeTab === 'elections' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                مدیریت انتخابات شورای صنفی دانشجویان
              </h3>
              <p className="text-xs text-slate-500">
                ثبت رأی دانشجویان منحصراً زمانی امکان‌پذیر است که بازه رأی‌گیری آن انتخابات توسط شما فعال و اطلاع‌رسانی شود.
              </p>
            </div>
            <button
              onClick={() => setIsElectionModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ ایجاد دوره انتخابات جدید</span>
            </button>
          </div>

          {elections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
              هنوز هیچ دوره انتخاباتی تعریف نشده است. برای شروع دکمه «ایجاد دوره انتخابات جدید» را بزنید.
            </div>
          ) : (
            <div className="space-y-4">
              {elections.map((el) => {
                const elVotes = votes.filter((v) => v.electionId === el.id);
                return (
                  <div
                    key={el.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 space-y-4 ${
                      el.isActiveWindow
                        ? 'border-emerald-400 dark:border-emerald-700'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">
                            {el.electionCode}
                          </span>
                          <h4 className="font-black text-base text-slate-900 dark:text-white">
                            {el.title}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                              el.isActiveWindow
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {el.isActiveWindow ? 'بازه رأی‌گیری فعال و باز' : 'صندوق بسته'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          بازه اعلامی: {el.startDate} ({el.startTime || '-'}) تا {el.endDate} (
                          {el.endTime || '-'}) • مجاز:{' '}
                          {el.targetEligibility === 'dorm_only'
                            ? 'فقط دانشجویان خوابگاهی'
                            : 'همه دانشجویان (خوابگاهی و ترددی)'}{' '}
                          • حداکثر انتخاب: {el.maxSelections} نفر • کل آرا: {elVotes.length} رأی
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {el.isActiveWindow ? (
                          <button
                            onClick={() => handleToggleWindow(el, false)}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>بستن بازه رأی‌گیری</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleWindow(el, true)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>فعال‌سازی و اطلاع‌رسانی بازه رأی‌گیری</span>
                          </button>
                        )}

                        <button
                          onClick={() => exportGuildElectionResultsToExcel(el, votes)}
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>اکسل آرا</span>
                        </button>

                        <button
                          onClick={() => {
                            Storage.deleteGuildElection(el.id);
                            setFeedback({ ok: true, msg: 'دوره انتخابات حذف شد.' });
                            reloadLocal();
                          }}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {el.noticeText && (
                      <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                        <Bell className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{el.noticeText}</span>
                      </div>
                    )}

                    {/* جدول نتایج زنده کاندیداها */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {el.candidates.map((c) => {
                        const cVotes = elVotes.filter((v) => v.candidateIds.includes(c.id));
                        const pct =
                          elVotes.length > 0 ? Math.round((cVotes.length / elVotes.length) * 100) : 0;
                        return (
                          <div
                            key={c.id}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                {c.fullName}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-black tabular-nums">
                                {cVotes.length} رأی ({pct}٪)
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {c.fieldOfStudy || '-'} {c.dormName ? `• ${c.dormName}` : ''}
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* تب ۳: پرونده‌های معرفی‌شده به شورای انضباطی */}
      {activeTab === 'disciplinary' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <input
                  type="text"
                  value={discSearch}
                  onChange={(e) => setDiscSearch(e.target.value)}
                  placeholder="جستجو در پرونده‌ها (نام دانشجو، کد پرونده، تخلف، معرف)..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={discStatusFilter}
                onChange={(e) => setDiscStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه وضعیت‌های رسیدگی</option>
                <option value="pending_review">در انتظار بررسی شورا</option>
                <option value="session_scheduled">تعیین وقت جلسه شورا</option>
                <option value="verdict_issued">صدور رأی شورا</option>
                <option value="closed">مختومه‌شده</option>
              </select>
            </div>

            <button
              onClick={() => exportDisciplinaryReferralsToExcel(filteredReferrals)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>خروجی اکسل پرونده‌ها</span>
            </button>
          </div>

          {filteredReferrals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
              هیچ پرونده معرفی‌شده به شورای انضباطی یافت نشد.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReferrals.map((ref) => {
                const stBadge = DISC_STATUS_LABELS[ref.status];
                return (
                  <div
                    key={ref.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-mono text-[11px] font-bold">
                          {ref.referralCode}
                        </span>
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {ref.studentName}
                        </span>
                        <span className="text-xs font-mono text-slate-500">({ref.studentId})</span>
                        <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-bold">
                          {ref.violationLabel}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${stBadge.cls}`}>
                          {stBadge.label}
                        </span>
                      </div>

                      <button
                        onClick={() => openReferralEditor(ref)}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>تعیین وقت جلسه / ثبت رأی شورا</span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                      <span>
                        معرفی‌کننده: <strong>{ref.referredByName}</strong> (
                        {ref.referredByRole === 'admin'
                          ? 'مدیر کل'
                          : ref.referredByRole === 'vice_dean'
                          ? 'معاونت دانشجویی'
                          : 'سرپرست سرا'})
                      </span>
                      <span>تاریخ معرفی: {ref.referredAt}</span>
                      <span>
                        محل اسکان: {ref.dormName ? `${ref.dormName} - اتاق ${ref.roomNumber || '-'}` : 'ترددی'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/50 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {ref.referralText}
                    </div>

                    {(ref.sessionDate || ref.verdict || ref.councilNotes) && (
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                        {ref.sessionDate && (
                          <div>
                            <strong>زمان و محل جلسه شورا:</strong> {ref.sessionDate}{' '}
                            {ref.sessionTime || ''} — {ref.sessionLocation || '-'}
                          </div>
                        )}
                        {ref.verdict && (
                          <div className="text-purple-800 dark:text-purple-300 font-bold">
                            رأی / تصمیم شورا: {ref.verdict}
                          </div>
                        )}
                        {ref.councilNotes && <div>توضیحات شورا: {ref.councilNotes}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* تب ۲ جدید: برنامه‌ریزی متنوع ورزشی و تربیت بدنی */}
      {activeTab === 'sports' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>برنامه‌ریزی متنوع ورزشی، المپیادهای درون‌سرایی و ورزش همگانی</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  تعریف برنامه‌های ورزشی (کلاس آموزشی، مسابقه، ورزش صبحگاهی، اردو)، انتشار در کارتابل دانشجویان و مدیریت حضور و غیاب
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={openNewSportModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ثبت برنامه ورزشی جدید</span>
                </button>
                <button
                  onClick={() => exportSportsProgramsToExcel(filteredSportsPrograms, sportsRegistrations)}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>خروجی اکسل ورزشی</span>
                </button>
                <button
                  onClick={handlePrintSportsSchedule}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ تقویم ورزشی (A4)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={spSearch}
                  onChange={(e) => setSpSearch(e.target.value)}
                  placeholder="جستجو در عنوان، کد برنامه، سالن یا مربی..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={spTypeFilter}
                onChange={(e) => setSpTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه رشته‌های ورزشی</option>
                {(Object.keys(SPORT_TYPE_LABELS) as SportsProgramType[]).map((k) => (
                  <option key={k} value={k}>
                    {SPORT_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>

              <select
                value={spKindFilter}
                onChange={(e) => setSpKindFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه انواع برنامه</option>
                {(Object.keys(SPORT_KIND_LABELS) as SportsProgramKind[]).map((k) => (
                  <option key={k} value={k}>
                    {SPORT_KIND_LABELS[k].label}
                  </option>
                ))}
              </select>

              <select
                value={spStatusFilter}
                onChange={(e) => setSpStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه وضعیت‌ها</option>
                {(Object.keys(SPORT_STATUS_LABELS) as SportsProgramStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {SPORT_STATUS_LABELS[k].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredSportsPrograms.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
              هیچ برنامه ورزشی با فیلتر انتخابی یافت نشد. از دکمه «+ ثبت برنامه ورزشی جدید» استفاده کنید.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSportsPrograms.map((p) => {
                const progRegs = sportsRegistrations.filter(
                  (r) => r.programId === p.id && r.status !== 'cancelled'
                );
                const attendedCount = progRegs.filter((r) => r.status === 'attended').length;
                const kindMeta = SPORT_KIND_LABELS[p.programKind];
                const statusMeta = SPORT_STATUS_LABELS[p.status];
                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                              {p.programCode}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${kindMeta.cls}`}>
                              {kindMeta.label}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusMeta.cls}`}>
                              {statusMeta.label}
                            </span>
                          </div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white">
                            {p.title}
                          </h4>
                        </div>

                        <button
                          onClick={() => handleToggleSportPublish(p)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer border shrink-0 ${
                            p.isPublishedToStudents
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                          title={
                            p.isPublishedToStudents
                              ? 'منتشرشده در کارتابل دانشجو (کلیک برای مخفی‌سازی)'
                              : 'مخفی از کارتابل دانشجو (کلیک برای انتشار)'
                          }
                        >
                          {p.isPublishedToStudents ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>منتشرشده</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>پیش‌نویس</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                        <div>
                          <strong>رشته:</strong> {SPORT_TYPE_LABELS[p.sportType]}
                        </div>
                        <div>
                          <strong>محدوده / سرا:</strong> {p.dormName}
                        </div>
                        <div>
                          <strong>جنسیت مجاز:</strong> {GENDER_SCOPE_LABELS[p.genderScope]}
                        </div>
                        <div>
                          <strong>زمان‌بندی:</strong>{' '}
                          {[p.dayOfWeek ? DAY_OF_WEEK_LABELS[p.dayOfWeek] : '', p.scheduleDate]
                            .filter(Boolean)
                            .join(' • ')}{' '}
                          ({p.startTime} تا {p.endTime})
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            <strong>مکان:</strong> {p.venue}
                            {p.coachName ? ` • مربی/سرپرست فنی: ${p.coachName}` : ''}
                          </span>
                        </div>
                      </div>

                      {p.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                      {(p.eligibility || p.equipmentNeeded) && (
                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                          {p.eligibility && <span>شرایط: {p.eligibility}</span>}
                          {p.equipmentNeeded && <span>لوازم مورد نیاز: {p.equipmentNeeded}</span>}
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        ثبت‌نامی: <span className="text-emerald-600">{progRegs.length}</span>
                        {p.maxCapacity ? ` از ${p.maxCapacity}` : ' (ظرفیت آزاد)'}
                        {attendedCount > 0 && (
                          <span className="text-[11px] text-teal-600 mr-2">
                            ({attendedCount} حاضر تاییدشده)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => setManagingRegsProgramId(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>شرکت‌کنندگان و حضور ({progRegs.length})</span>
                        </button>
                        <button
                          onClick={() => openEditSportModal(p)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                          title="ویرایش برنامه ورزشی"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteSportProgram(p)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 cursor-pointer"
                          title="حذف برنامه ورزشی"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* مودال جزئیات کامل پرونده دانشجو (فقط خواندنی) */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-cyan-800 text-white flex items-center justify-between">
              <h3 className="font-black text-base">مشخصات دانشجو: {selectedStudent.fullName}</h3>
              <button onClick={() => setSelectedStudent(null)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-2.5 text-xs">
              <div>
                <strong>نوع اسکان:</strong>{' '}
                {isStudentDormResident(selectedStudent) ? 'دانشجوی خوابگاهی' : 'دانشجوی ترددی'}
              </div>
              <div>
                <strong>شماره دانشجویی:</strong> {selectedStudent.studentId} •{' '}
                <strong>کد ملی:</strong> {selectedStudent.nationalId}
              </div>
              <div>
                <strong>نام پدر:</strong> {selectedStudent.fatherName || '-'} •{' '}
                <strong>تاریخ تولد:</strong> {selectedStudent.birthDate || '-'}
              </div>
              <div>
                <strong>رشته و ورودی:</strong> {selectedStudent.fieldOfStudy} ({selectedStudent.entryTerm})
              </div>
              <div>
                <strong>استان و شهر:</strong> {selectedStudent.province} / {selectedStudent.city}
              </div>
              <div>
                <strong>سرا و اتاق:</strong>{' '}
                {dorms.find((d) => d.id === selectedStudent.assignedDormId)?.name || '-'}{' '}
                {selectedStudent.assignedRoomNumber ? `— اتاق ${selectedStudent.assignedRoomNumber}` : ''}
              </div>
              <div>
                <strong>موبایل و تماس اضطراری:</strong> {selectedStudent.mobile || selectedStudent.phone || '-'}{' '}
                / {selectedStudent.emergencyPhone || '-'}
              </div>
              <div>
                <strong>سابقه بیماری / گروه خونی:</strong>{' '}
                {[
                  selectedStudent.customFields?.['بیماری خاص'],
                  selectedStudent.customFields?.['گروه خونی']
                    ? `گروه خونی: ${selectedStudent.customFields['گروه خونی']}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' • ') || 'ثبت نشده'}
              </div>
              <div>
                <strong>رشته ورزشی و علایق:</strong>{' '}
                {[
                  selectedStudent.customFields?.['رشته ورزشی'],
                  selectedStudent.customFields?.['علاقه‌مندی‌ها'] || selectedStudent.customFields?.['علایق'],
                ]
                  .filter(Boolean)
                  .join(' • ') || 'ثبت نشده'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال ایجاد انتخابات جدید */}
      {isElectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-indigo-700 text-white flex items-center justify-between">
              <h3 className="font-black text-base">ایجاد دوره جدید انتخابات شورای صنفی</h3>
              <button onClick={() => setIsElectionModalOpen(false)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateElection} className="p-5 space-y-4 text-xs max-h-[78vh] overflow-y-auto">
              <div>
                <label className="block font-bold mb-1">عنوان انتخابات شورای صنفی *</label>
                <input
                  type="text"
                  required
                  value={elTitle}
                  onChange={(e) => setElTitle(e.target.value)}
                  placeholder="مثلاً: انتخابات شورای صنفی و رفاهی سراهای دانشجویی ۱۴۰۵"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">واجدین شرایط رأی‌دهی</label>
                  <select
                    value={elEligibility}
                    onChange={(e) =>
                      setElEligibility(e.target.value as 'all_students' | 'dorm_only')
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="all_students">همه دانشجویان (خوابگاهی و ترددی)</option>
                    <option value="dorm_only">فقط دانشجویان خوابگاهی</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">حداکثر تعداد انتخاب برای هر دانشجو</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={elMaxSelections}
                    onChange={(e) => setElMaxSelections(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold mb-1">تاریخ شروع</label>
                  <input
                    type="text"
                    value={elStartDate}
                    onChange={(e) => setElStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ساعت شروع</label>
                  <input
                    type="text"
                    value={elStartTime}
                    onChange={(e) => setElStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">تاریخ پایان</label>
                  <input
                    type="text"
                    value={elEndDate}
                    onChange={(e) => setElEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ساعت پایان</label>
                  <input
                    type="text"
                    value={elEndTime}
                    onChange={(e) => setElEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">متن اطلاعیه رسمی به دانشجویان</label>
                <textarea
                  rows={2}
                  value={elNotice}
                  onChange={(e) => setElNotice(e.target.value)}
                  placeholder="اطلاعیه زمان و ضوابط شرکت در انتخابات شورای صنفی..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* افزودن کاندیداها */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-extrabold text-slate-900 dark:text-white">
                  معرفی کاندیداها ({elCandidates.length} نفر انتخاب‌شده)
                </div>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={candSearch}
                    onChange={(e) => setCandSearch(e.target.value)}
                    placeholder="جستجوی سریع از لیست دانشجویان برای افزودن به کاندیداها..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  {candSearch.trim().length >= 2 && (
                    <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                      {students
                        .filter((s) =>
                          `${s.fullName} ${s.studentId}`
                            .toLowerCase()
                            .includes(candSearch.toLowerCase())
                        )
                        .slice(0, 8)
                        .map((s) => (
                          <button
                            key={s.studentId}
                            type="button"
                            onClick={() => addCandidateFromStudent(s)}
                            className="w-full px-3 py-1.5 text-right hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between cursor-pointer"
                          >
                            <span>
                              {s.fullName} ({s.studentId})
                            </span>
                            <span className="text-indigo-600 font-bold">+ افزودن</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={manualCandName}
                    onChange={(e) => setManualCandName(e.target.value)}
                    placeholder="نام کاندیدا (ثبت دستی)"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={manualCandField}
                    onChange={(e) => setManualCandField(e.target.value)}
                    placeholder="رشته / ورودی"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={manualCandSlogan}
                      onChange={(e) => setManualCandSlogan(e.target.value)}
                      placeholder="شعار انتخاباتی"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      onClick={addManualCandidate}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer"
                    >
                      افزودن
                    </button>
                  </div>
                </div>

                {elCandidates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {elCandidates.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-900 font-bold"
                      >
                        <span>{c.fullName}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setElCandidates((prev) => prev.filter((item) => item.id !== c.id))
                          }
                          className="text-rose-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={elActivateNow}
                  onChange={(e) => setElActivateNow(e.target.checked)}
                />
                <span>بلافاصله بازه رأی‌گیری فعال و اطلاعیه رسمی برای دانشجویان منتشر شود</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsElectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  ثبت دوره انتخابات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال رسیدگی به پرونده شورای انضباطی */}
      {editingReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 bg-rose-700 text-white flex items-center justify-between">
              <h3 className="font-black text-base">
                رسیدگی شورای انضباطی — {editingReferral.studentName} ({editingReferral.referralCode})
              </h3>
              <button onClick={() => setEditingReferral(null)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveReferralUpdate} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">وضعیت رسیدگی شورا</label>
                <select
                  value={refStatus}
                  onChange={(e) => setRefStatus(e.target.value as DisciplinaryReferralStatus)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="pending_review">در انتظار بررسی شورا</option>
                  <option value="session_scheduled">تعیین وقت جلسه شورای انضباطی</option>
                  <option value="verdict_issued">صدور رأی شورا</option>
                  <option value="closed">مختومه‌شده</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">تاریخ جلسه شورا</label>
                  <input
                    type="text"
                    value={refSessionDate}
                    onChange={(e) => setRefSessionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ساعت جلسه</label>
                  <input
                    type="text"
                    value={refSessionTime}
                    onChange={(e) => setRefSessionTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">محل برگزاری جلسه</label>
                <input
                  type="text"
                  value={refSessionLoc}
                  onChange={(e) => setRefSessionLoc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">رأی یا تصمیم شورای انضباطی</label>
                <input
                  type="text"
                  value={refVerdict}
                  onChange={(e) => setRefVerdict(e.target.value)}
                  placeholder="مثلاً: تذکر کتبی با درج در پرونده، کسر امتیاز، لغو اسکان..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">توضیحات و صورتجلسه شورا</label>
                <textarea
                  rows={2}
                  value={refNotes}
                  onChange={(e) => setRefNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={refNotifyStudent}
                  onChange={(e) => setRefNotifyStudent(e.target.checked)}
                />
                <span>ارسال خودکار پیام ابلاغ زمان جلسه / رأی به کارتابل دانشجو</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReferral(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>ذخیره وضعیت پرونده</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ثبت / ویرایش برنامه ورزشی و تربیت بدنی */}
      {isSportsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-emerald-700 text-white flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2">
                <Dumbbell className="w-5 h-5" />
                <span>
                  {editingSportProgram
                    ? `ویرایش برنامه ورزشی (${editingSportProgram.programCode})`
                    : 'ثبت برنامه ورزشی و تربیت بدنی جدید'}
                </span>
              </h3>
              <button
                onClick={() => {
                  setIsSportsModalOpen(false);
                  setEditingSportProgram(null);
                }}
                className="p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveSportProgram}
              className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto"
            >
              <div>
                <label className="block font-bold mb-1">عنوان برنامه یا رویداد ورزشی *</label>
                <input
                  type="text"
                  required
                  value={spTitle}
                  onChange={(e) => setSpTitle(e.target.value)}
                  placeholder="مثلاً: لیگ فوتسال جام سراهای دانشگاه فرهنگیان / کلاس بدمینتون"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">رشته ورزشی</label>
                  <select
                    value={spType}
                    onChange={(e) => setSpType(e.target.value as SportsProgramType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {(Object.keys(SPORT_TYPE_LABELS) as SportsProgramType[]).map((k) => (
                      <option key={k} value={k}>
                        {SPORT_TYPE_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">نوع برنامه</label>
                  <select
                    value={spKind}
                    onChange={(e) => setSpKind(e.target.value as SportsProgramKind)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {(Object.keys(SPORT_KIND_LABELS) as SportsProgramKind[]).map((k) => (
                      <option key={k} value={k}>
                        {SPORT_KIND_LABELS[k].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">وضعیت ثبت‌نام / اجرا</label>
                  <select
                    value={spStatus}
                    onChange={(e) => setSpStatus(e.target.value as SportsProgramStatus)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {(Object.keys(SPORT_STATUS_LABELS) as SportsProgramStatus[]).map((k) => (
                      <option key={k} value={k}>
                        {SPORT_STATUS_LABELS[k].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">سرا / محدوده برگزاری</label>
                  <select
                    value={spDormId}
                    onChange={(e) => setSpDormId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="all">کلیه سراها و پردیس</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">جامعه جنسیتی مجاز</label>
                  <select
                    value={spGenderScope}
                    onChange={(e) =>
                      setSpGenderScope(e.target.value as 'all' | 'brothers' | 'sisters')
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="all">عمومی (برادران و خواهران)</option>
                    <option value="brothers">ویژه دانشجویان برادر</option>
                    <option value="sisters">ویژه دانشجویان خواهر</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">روز هفته</label>
                  <select
                    value={spDayOfWeek}
                    onChange={(e) => setSpDayOfWeek(e.target.value as DayOfWeek | 'multiple')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {(Object.keys(DAY_OF_WEEK_LABELS) as (DayOfWeek | 'multiple')[]).map((k) => (
                      <option key={k} value={k}>
                        {DAY_OF_WEEK_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">تاریخ شروع / اجرا</label>
                  <input
                    type="text"
                    value={spScheduleDate}
                    onChange={(e) => setSpScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ساعت شروع</label>
                  <input
                    type="text"
                    value={spStartTime}
                    onChange={(e) => setSpStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ساعت پایان</label>
                  <input
                    type="text"
                    value={spEndTime}
                    onChange={(e) => setSpEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">مکان / سالن ورزشی *</label>
                  <input
                    type="text"
                    required
                    value={spVenue}
                    onChange={(e) => setSpVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">مربی / سرپرست فنی</label>
                  <input
                    type="text"
                    value={spCoachName}
                    onChange={(e) => setSpCoachName(e.target.value)}
                    placeholder="نام مربی یا کارشناس تربیت بدنی"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ظرفیت (خالی = نامحدود)</label>
                  <input
                    type="number"
                    min={1}
                    value={spMaxCapacity}
                    onChange={(e) => setSpMaxCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">شرایط شرکت‌کنندگان</label>
                  <input
                    type="text"
                    value={spEligibility}
                    onChange={(e) => setSpEligibility(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">تجهیزات / لوازم مورد نیاز</label>
                  <input
                    type="text"
                    value={spEquipment}
                    onChange={(e) => setSpEquipment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">توضیحات تکمیلی و قوانین برنامه</label>
                <textarea
                  rows={2}
                  value={spDescription}
                  onChange={(e) => setSpDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={spPublishNow}
                  onChange={(e) => setSpPublishNow(e.target.checked)}
                />
                <span>انتشار فوری این برنامه ورزشی در کارتابل دانشجویان جهت مشاهده و ثبت‌نام</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSportsModalOpen(false);
                    setEditingSportProgram(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingSportProgram ? 'ذخیره تغییرات برنامه' : 'ثبت برنامه ورزشی'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال لیست شرکت‌کنندگان و ثبت حضور و غیاب برنامه ورزشی */}
      {managingRegsProgramId && (() => {
        const prog = sportsPrograms.find((p) => p.id === managingRegsProgramId);
        if (!prog) return null;
        const regs = sportsRegistrations.filter((r) => r.programId === prog.id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
              <div className="p-5 bg-cyan-800 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base">
                    فهرست شرکت‌کنندگان و حضور و غیاب — {prog.title}
                  </h3>
                  <p className="text-[11px] text-cyan-100 mt-0.5">
                    {SPORT_TYPE_LABELS[prog.sportType]} • {prog.venue} • {prog.startTime} تا {prog.endTime}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintProgramRoster(prog)}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>چاپ لیست حضور</span>
                  </button>
                  <button
                    onClick={() => setManagingRegsProgramId(null)}
                    className="p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3 text-xs">
                {regs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    هنوز هیچ دانشجویی در این برنامه ورزشی ثبت‌نام نکرده است.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    {regs.map((r, idx) => (
                      <div
                        key={r.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-white">
                              {idx + 1}. {r.studentName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              ({r.studentId})
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                r.isDormResident
                                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                                  : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                              }`}
                            >
                              {r.isDormResident
                                ? `خوابگاهی ${r.dormName ? `(${r.dormName})` : ''}`
                                : 'ترددی'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold">
                              سطح:{' '}
                              {r.skillLevel === 'advanced'
                                ? 'حرفه‌ای'
                                : r.skillLevel === 'intermediate'
                                ? 'متوسط'
                                : 'مبتدی'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                            {r.studentFieldOfStudy && <span>رشته: {r.studentFieldOfStudy}</span>}
                            {r.studentMobile && <span>موبایل: {r.studentMobile}</span>}
                            <span>ثبت‌نام: {r.registeredAt}</span>
                          </div>
                          {r.note && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                              یادداشت دانشجو: {r.note}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleUpdateRegStatus(r.id, 'attended')}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer border ${
                              r.status === 'attended'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white dark:bg-slate-800 text-emerald-700 border-emerald-300'
                            }`}
                          >
                            حاضر
                          </button>
                          <button
                            onClick={() => handleUpdateRegStatus(r.id, 'registered')}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer border ${
                              r.status === 'registered'
                                ? 'bg-cyan-600 text-white border-cyan-600'
                                : 'bg-white dark:bg-slate-800 text-cyan-700 border-cyan-300'
                            }`}
                          >
                            ثبت‌نام‌شده
                          </button>
                          <button
                            onClick={() => handleUpdateRegStatus(r.id, 'cancelled')}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer border ${
                              r.status === 'cancelled'
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white dark:bg-slate-800 text-rose-600 border-rose-300'
                            }`}
                          >
                            لغو
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* مودال تایید حذف برنامه ورزشی */}
      {confirmDeleteSportProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
              <h3 className="font-black text-sm">حذف برنامه ورزشی</h3>
              <button
                onClick={() => setConfirmDeleteSportProgram(null)}
                className="p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                آیا از حذف برنامه ورزشی <strong>«{confirmDeleteSportProgram.title}»</strong> (کد{' '}
                {confirmDeleteSportProgram.programCode}) و کلیه ثبت‌نام‌های مرتبط با آن اطمینان دارید؟
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDeleteSportProgram(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleConfirmDeleteSport}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  تأیید و حذف دائمی
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <SendSecurityReportModal
        isOpen={isSendSecurityModalOpen}
        onClose={() => setIsSendSecurityModalOpen(false)}
        reporterRole="student_affairs"
        reporterId={staff.id}
        reporterName={staff.fullName}
        students={students}
        dorms={dorms}
        rooms={rooms}
        onSuccess={(msg) => {
          setFeedback({ ok: true, msg });
          setTimeout(() => setFeedback(null), 4000);
          reloadLocal();
        }}
      />
    </div>
  );
};
