import React, { useMemo, useState } from 'react';
import {
  AcademicWorkflowActorRole,
  AcademicWorkflowRequest,
  AcademicWorkflowRequestCategory,
  AcademicWorkflowStage,
  AcademicWorkflowTargetMode,
  EducationStaff,
  GraduationStaff,
  Student,
} from '../types';
import {
  Storage,
  doesEducationStaffCoverField,
  isEducationDepartmentHead,
  normalizeAssignedFieldsList,
  normalizePersianSearch,
} from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  GitBranch,
  GraduationCap,
  PlusCircle,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';

export const ACADEMIC_WORKFLOW_CATEGORY_LABELS: Record<AcademicWorkflowRequestCategory, string> = {
  graduation_action: 'امور فراغت از تحصیل و تأییدیه فارغ‌التحصیلی',
  course_equivalency: 'معادل‌سازی و تطبیق واحد درسی',
  course_prerequisite: 'هم‌نیاز / پیش‌نیاز و اخذ درس تخصصی',
  unit_registration: 'حذف و اضافه، ترمیم یا سقف واحد',
  grade_review: 'بررسی نمره، حذف اضطراری یا کارورزی',
  academic_leave: 'مرخصی تحصیلی، میهمانی یا انتقال',
  certificate: 'گواهی اشتغال به تحصیل و مکاتبات آموزشی',
  other: 'سایر درخواست‌های آموزشی',
};

const STAGE_META: Record<
  AcademicWorkflowStage,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending_dept_head: {
    label: 'در انتظار بررسی مدیر گروه',
    badgeClass:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
    dotClass: 'bg-indigo-600',
  },
  pending_expert_action: {
    label: 'در کارتابل کارشناس آموزش رشته',
    badgeClass:
      'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200 border-sky-200 dark:border-sky-800',
    dotClass: 'bg-sky-600',
  },
  pending_graduation: {
    label: 'در کارتابل کارشناس فارغ‌التحصیلان (اقدام نهایی)',
    badgeClass:
      'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200 border-violet-200 dark:border-violet-800',
    dotClass: 'bg-violet-600',
  },
  completed: {
    label: 'انجام و تکمیل شد',
    badgeClass:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-600',
  },
  rejected: {
    label: 'عدم تأیید / مختومه',
    badgeClass:
      'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border-rose-200 dark:border-rose-800',
    dotClass: 'bg-rose-600',
  },
};

const ACTOR_ROLE_LABELS: Record<AcademicWorkflowActorRole, string> = {
  student: 'دانشجو',
  education_expert: 'کارشناس آموزش',
  department_head: 'مدیر گروه آموزشی',
  graduation: 'کارشناس واحد فارغ‌التحصیلان',
  admin: 'مدیر کل سامانه',
};

interface StudentModeProps {
  mode: 'student';
  student: Student;
  onDataChange: () => void;
}

interface StaffModeProps {
  mode: 'staff';
  actorRole: 'department_head' | 'education_expert' | 'graduation';
  staff: EducationStaff | GraduationStaff;
  students: Student[];
  cloudSyncTick?: number;
  onDataChange: () => void;
}

type AcademicWorkflowPanelProps = StudentModeProps | StaffModeProps;

export const AcademicWorkflowPanel: React.FC<AcademicWorkflowPanelProps> = (props) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedTimelineIds, setExpandedTimelineIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [staffFilter, setStaffFilter] = useState<'my_queue' | 'all' | 'done'>('my_queue');

  // فرم ثبت درخواست جدید (دانشجو یا ثبت ارجاع توسط کارشناس آموزش)
  const [showNewForm, setShowNewForm] = useState(props.mode === 'student');
  const [targetMode, setTargetMode] = useState<AcademicWorkflowTargetMode>(
    props.mode === 'student' ? 'major_dept_head' : 'major_dept_head'
  );
  const [category, setCategory] = useState<AcademicWorkflowRequestCategory>(
    props.mode === 'staff' ? 'graduation_action' : 'course_prerequisite'
  );
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [selectedDeptHeadId, setSelectedDeptHeadId] = useState('');
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [autoRouteToGraduation, setAutoRouteToGraduation] = useState(true);

  // انتخاب دانشجو (برای حالت کارشناس آموزش که درخواست دانشجو را به مدیر گروه ارجاع می‌دهد)
  const [studentSearch, setStudentSearch] = useState('');
  const [pickedStudentId, setPickedStudentId] = useState('');

  // وضعیت فیلدهای اقدام در کارت‌های کارتابل کارکنان
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [directiveById, setDirectiveById] = useState<Record<string, string>>({});
  const [targetStaffById, setTargetStaffById] = useState<Record<string, string>>({});
  const [autoGradById, setAutoGradById] = useState<Record<string, boolean>>({});
  const [letterNoById, setLetterNoById] = useState<Record<string, string>>({});
  const [actionModeById, setActionModeById] = useState<Record<string, string>>({});

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const allEducationStaff = useMemo(() => {
    void refreshTick;
    return Storage.getEducationStaff().filter((e) => e.status !== 'inactive' && e.isActive !== false);
  }, [refreshTick, props.mode === 'staff' ? props.cloudSyncTick : 0]);

  const deptHeads = useMemo(
    () => allEducationStaff.filter((e) => isEducationDepartmentHead(e)),
    [allEducationStaff]
  );

  const educationExperts = useMemo(
    () => allEducationStaff.filter((e) => !isEducationDepartmentHead(e)),
    [allEducationStaff]
  );

  const allRequests = useMemo(() => {
    void refreshTick;
    return Storage.getAcademicWorkflowRequests();
  }, [refreshTick, props.mode === 'staff' ? props.cloudSyncTick : 0]);

  const isRequestInMyStaffQueue = (req: AcademicWorkflowRequest): boolean => {
    if (props.mode !== 'staff') return false;
    if (props.actorRole === 'graduation') {
      return req.currentStage === 'pending_graduation';
    }
    const eduStaff = props.staff as EducationStaff;
    const assignedFields = normalizeAssignedFieldsList(eduStaff.assignedFields);
    if (props.actorRole === 'department_head') {
      if (req.currentStage !== 'pending_dept_head') return false;
      if (req.assignedDeptHeadId === eduStaff.id) return true;
      if (!req.assignedDeptHeadId && (assignedFields.length === 0 || doesEducationStaffCoverField(eduStaff, req.studentFieldOfStudy))) {
        return true;
      }
      return false;
    }
    // کارشناس آموزش
    if (req.currentStage !== 'pending_expert_action') return false;
    if (req.assignedExpertId === eduStaff.id) return true;
    if (!req.assignedExpertId && (assignedFields.length === 0 || doesEducationStaffCoverField(eduStaff, req.studentFieldOfStudy))) {
      return true;
    }
    return false;
  };

  const isRequestVisibleToStaff = (req: AcademicWorkflowRequest): boolean => {
    if (props.mode !== 'staff') return false;
    if (props.actorRole === 'graduation') {
      return (
        req.currentStage === 'pending_graduation' ||
        req.assignedGraduationStaffId === props.staff.id ||
        Boolean(req.autoRouteToGraduationOnDeptApproval) ||
        req.steps.some((s) => s.actorRole === 'graduation' || s.toStage === 'pending_graduation')
      );
    }
    const eduStaff = props.staff as EducationStaff;
    const assignedFields = normalizeAssignedFieldsList(eduStaff.assignedFields);
    if (assignedFields.length === 0) return true;
    if (
      req.assignedDeptHeadId === eduStaff.id ||
      req.assignedExpertId === eduStaff.id ||
      req.initiatorId === eduStaff.id ||
      req.steps.some((s) => s.actorId === eduStaff.id || s.targetStaffId === eduStaff.id)
    ) {
      return true;
    }
    return doesEducationStaffCoverField(eduStaff, req.studentFieldOfStudy);
  };

  const visibleRequests = useMemo(() => {
    const q = normalizePersianSearch(searchQuery);
    const base =
      props.mode === 'student'
        ? allRequests.filter((r) => r.studentId === props.student.studentId)
        : allRequests.filter((r) => {
            if (!isRequestVisibleToStaff(r)) return false;
            if (staffFilter === 'my_queue') return isRequestInMyStaffQueue(r);
            if (staffFilter === 'done') return r.currentStage === 'completed' || r.currentStage === 'rejected';
            return true;
          });

    if (!q) return base;
    return base.filter((r) => {
      const hay = normalizePersianSearch(
        `${r.trackingCode} ${r.studentName} ${r.studentId} ${toEnglishDigits(r.studentId)} ${r.studentFieldOfStudy} ${r.subject} ${r.description} ${r.courseTitle || ''} ${r.assignedDeptHeadName || ''} ${r.assignedExpertName || ''}`
      );
      return hay.includes(q);
    });
  }, [allRequests, searchQuery, staffFilter, props]);

  const myQueueCount = useMemo(() => {
    if (props.mode !== 'staff') return 0;
    return allRequests.filter((r) => isRequestInMyStaffQueue(r)).length;
  }, [allRequests, props]);

  // دانشجویان فیلترشده برای فرم ثبت ارجاع توسط کارشناس آموزش
  const matchedStudentsForExpert = useMemo(() => {
    if (props.mode !== 'staff') return [];
    const eduStaff = props.staff as EducationStaff;
    const scoped =
      props.actorRole === 'education_expert' && normalizeAssignedFieldsList(eduStaff.assignedFields).length > 0
        ? props.students.filter((s) => doesEducationStaffCoverField(eduStaff, s.fieldOfStudy))
        : props.students;
    const q = normalizePersianSearch(studentSearch);
    if (!q) return scoped.slice(0, 25);
    return scoped
      .filter((s) =>
        normalizePersianSearch(
          `${s.fullName} ${s.studentId} ${toEnglishDigits(s.studentId)} ${s.fieldOfStudy || ''}`
        ).includes(q)
      )
      .slice(0, 25);
  }, [props, studentSearch]);

  const activeFormStudent: Student | null = useMemo(() => {
    if (props.mode === 'student') return props.student;
    return props.students.find((s) => s.studentId === pickedStudentId) || null;
  }, [props, pickedStudentId]);

  // مدیران گروه پیشنهادی بر اساس رشته دانشجو
  const suggestedDeptHeads = useMemo(() => {
    if (!activeFormStudent) return deptHeads;
    const matching = deptHeads.filter((dh) =>
      doesEducationStaffCoverField(dh, activeFormStudent.fieldOfStudy)
    );
    return targetMode === 'course_dept_head'
      ? deptHeads
      : matching.length > 0
      ? matching
      : deptHeads;
  }, [deptHeads, activeFormStudent, targetMode]);

  const suggestedExperts = useMemo(() => {
    if (!activeFormStudent) return educationExperts;
    const matching = educationExperts.filter((ex) =>
      doesEducationStaffCoverField(ex, activeFormStudent.fieldOfStudy)
    );
    return matching.length > 0 ? matching : educationExperts;
  }, [educationExperts, activeFormStudent]);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFormStudent) {
      showToast('error', 'لطفاً ابتدا دانشجوی مورد نظر را انتخاب نمایید.');
      return;
    }

    const pickedDh = deptHeads.find((d) => d.id === selectedDeptHeadId) || suggestedDeptHeads[0];
    const pickedEx = educationExperts.find((ex) => ex.id === selectedExpertId) || suggestedExperts[0];

    const res = Storage.createAcademicWorkflowRequest({
      student: activeFormStudent,
      category,
      subject,
      description,
      courseTitle: targetMode === 'course_dept_head' ? courseTitle : undefined,
      initiatorRole:
        props.mode === 'student'
          ? 'student'
          : props.actorRole === 'department_head'
          ? 'department_head'
          : 'education_expert',
      initiatorId: props.mode === 'student' ? props.student.studentId : props.staff.id,
      initiatorName:
        props.mode === 'student'
          ? props.student.fullName
          : `${props.staff.fullName} (${
              props.actorRole === 'department_head' ? 'مدیر گروه' : 'کارشناس آموزش'
            })`,
      targetMode: props.mode === 'staff' ? 'major_dept_head' : targetMode,
      targetDeptHeadId:
        targetMode === 'education_expert' && props.mode === 'student' ? undefined : pickedDh?.id,
      targetDeptHeadName:
        targetMode === 'education_expert' && props.mode === 'student' ? undefined : pickedDh?.fullName,
      targetExpertId:
        props.mode === 'staff' && props.actorRole === 'education_expert'
          ? props.staff.id
          : pickedEx?.id,
      targetExpertName:
        props.mode === 'staff' && props.actorRole === 'education_expert'
          ? props.staff.fullName
          : pickedEx?.fullName,
      autoRouteToGraduationOnDeptApproval:
        props.mode === 'staff' ? autoRouteToGraduation : category === 'graduation_action',
    });

    if (res.success) {
      showToast('success', res.message);
      setSubject('');
      setDescription('');
      setCourseTitle('');
      if (props.mode === 'staff') {
        setPickedStudentId('');
        setStudentSearch('');
        setShowNewForm(false);
      }
      setRefreshTick((t) => t + 1);
      props.onDataChange();
    } else {
      showToast('error', res.message);
    }
  };

  const handleTransition = (
    req: AcademicWorkflowRequest,
    action:
      | 'refer_to_dept_head'
      | 'dept_head_approve_to_graduation'
      | 'dept_head_directive_to_expert'
      | 'dept_head_complete'
      | 'expert_forward_to_graduation'
      | 'expert_complete'
      | 'graduation_complete'
      | 'return_to_expert'
      | 'reject'
  ) => {
    if (props.mode !== 'staff') return;
    const note = (noteById[req.id] || '').trim();
    const directive = (directiveById[req.id] || '').trim();
    const pickedStaffId = targetStaffById[req.id] || '';
    const letterNo = (letterNoById[req.id] || '').trim();

    let targetStaffName: string | undefined;
    if (action === 'refer_to_dept_head' && pickedStaffId) {
      targetStaffName = deptHeads.find((d) => d.id === pickedStaffId)?.fullName;
    } else if (
      (action === 'dept_head_directive_to_expert' || action === 'return_to_expert') &&
      pickedStaffId
    ) {
      targetStaffName = educationExperts.find((e) => e.id === pickedStaffId)?.fullName;
    }

    const res = Storage.transitionAcademicWorkflowRequest(req.id, {
      action,
      actorRole: props.actorRole,
      actorId: props.staff.id,
      actorName: props.staff.fullName,
      targetStaffId: pickedStaffId || undefined,
      targetStaffName,
      directive: directive || undefined,
      note: note || undefined,
      finalLetterNumber: letterNo || undefined,
      autoRouteToGraduation: autoGradById[req.id] ?? true,
    });

    if (res.success) {
      showToast('success', res.message);
      setNoteById((prev) => ({ ...prev, [req.id]: '' }));
      setDirectiveById((prev) => ({ ...prev, [req.id]: '' }));
      setLetterNoById((prev) => ({ ...prev, [req.id]: '' }));
      setActionModeById((prev) => ({ ...prev, [req.id]: '' }));
      setRefreshTick((t) => t + 1);
      props.onDataChange();
    } else {
      showToast('error', res.message);
    }
  };

  const toggleTimeline = (id: string) => {
    setExpandedTimelineIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-5">
      {/* سربرگ گردش کار */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {props.mode === 'student'
                  ? 'درخواست‌های آموزشی و پیگیری گردش کار (مدیر گروه، کارشناس آموزش و فارغ‌التحصیلان)'
                  : 'گردش کار و ارجاعات یکپارچه حوزه معاونت آموزشی'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {props.mode === 'student'
                  ? 'می‌توانید درخواست خود را مستقیماً به مدیر گروه رشته خود، مدیر گروه تخصصی یک درس یا کارشناس آموزش ارسال کنید و تمام مراحل دستور مدیر گروه، اقدام کارشناس و ارجاع به واحد فارغ‌التحصیلان را زنده ببینید.'
                  : props.actorRole === 'education_expert'
                  ? 'امکان ارجاع درخواست دانشجویان به مدیر گروه مربوطه (با ارسال خودکار به کارتابل کارشناس فارغ‌التحصیلان پس از تأیید مدیر گروه) و اجرای دستورات ارسالی از مدیران گروه.'
                  : props.actorRole === 'department_head'
                  ? 'درخواست‌های ارجاع‌شده از کارشناسان آموزش و درخواست‌های مستقیم دانشجویان در این بخش نمایش داده می‌شوند. می‌توانید پس از تأیید به‌صورت خودکار به فارغ‌التحصیلان بفرستید یا همراه با دستورات اجرایی به کارشناس رشته ارجاع دهید.'
                  : 'درخواست‌هایی که توسط مدیران گروه تأیید یا از آموزش ارجاع شده‌اند به‌صورت خودکار در کارتابل شما جهت اقدام نهایی و ثبت شماره نامه قرار می‌گیرند.'}
              </p>
            </div>
          </div>

          {(props.mode === 'student' || props.actorRole === 'education_expert') && (
            <button
              type="button"
              onClick={() => setShowNewForm((prev) => !prev)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition cursor-pointer shrink-0"
            >
              {showNewForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>
                {showNewForm
                  ? 'بستن فرم ثبت درخواست'
                  : props.mode === 'student'
                  ? 'ثبت درخواست آموزشی جدید'
                  : 'ثبت و ارجاع درخواست دانشجو به مدیر گروه'}
              </span>
            </button>
          )}
        </div>

        {/* نقشه مسیرهای گردش کار */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="px-3.5 py-2.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/70 text-sky-900 dark:text-sky-200 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>مسیر ۱:</strong> کارشناس آموزش ← ارجاع به مدیر گروه ← پس از تأیید،{' '}
              <strong>ارسال خودکار به کارتابل کارشناس فارغ‌التحصیلان</strong>
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/70 text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>مسیر ۲:</strong> دانشجو ← مدیر گروه رشته یا مدیر گروه تخصصی درس ← ثبت{' '}
              <strong>دستورات لازم</strong> و ارسال به کارشناس رشته جهت اقدام
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* فرم ثبت درخواست جدید (دانشجو یا ارجاع توسط کارشناس آموزش) */}
      {showNewForm && (props.mode === 'student' || props.actorRole === 'education_expert') && (
        <form
          onSubmit={handleCreateRequest}
          className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-200/80 dark:border-indigo-800/70 p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Send className="w-4 h-4 text-indigo-600" />
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              {props.mode === 'student'
                ? 'فرم ارسال درخواست به مدیر گروه تخصصی/رشته یا کارشناس آموزش'
                : 'ثبت و ارجاع درخواست دانشجو از کارشناس آموزش به مدیر گروه مربوطه'}
            </h3>
          </div>

          {props.mode === 'student' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  {
                    id: 'major_dept_head',
                    title: 'مدیر گروه رشته خودم',
                    desc: `مدیر گروه ${props.student.fieldOfStudy || 'رشته تحصیلی شما'}`,
                  },
                  {
                    id: 'course_dept_head',
                    title: 'مدیر گروه تخصصی یک درس',
                    desc: 'ارسال به مدیر گروه تخصصی درس مرتبط (حتی گروه آموزشی دیگر)',
                  },
                  {
                    id: 'education_expert',
                    title: 'کارشناس آموزش رشته',
                    desc: 'بررسی اولیه و ارجاع در صورت نیاز به مدیر گروه',
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTargetMode(opt.id);
                    setSelectedDeptHeadId('');
                    setSelectedExpertId('');
                  }}
                  className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                    targetMode === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <div className="font-black text-xs">{opt.title}</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      targetMode === opt.id ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                انتخاب دانشجوی مورد نظر:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="جستجوی نام، شماره دانشجویی یا رشته..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
                <select
                  value={pickedStudentId}
                  onChange={(e) => setPickedStudentId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="">-- انتخاب دانشجو --</option>
                  {matchedStudentsForExpert.map((st) => (
                    <option key={st.studentId} value={st.studentId}>
                      {st.fullName} ({st.studentId}) — {st.fieldOfStudy}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                دسته‌بندی موضوع درخواست
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AcademicWorkflowRequestCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                {(
                  Object.entries(ACADEMIC_WORKFLOW_CATEGORY_LABELS) as Array<
                    [AcademicWorkflowRequestCategory, string]
                  >
                ).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {props.mode === 'student' && targetMode === 'education_expert' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  کارشناس آموزش مقصد
                </label>
                <select
                  value={selectedExpertId}
                  onChange={(e) => setSelectedExpertId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="">
                    تطبیق خودکار با رشته ({suggestedExperts[0]?.fullName || 'کارشناس آموزش'})
                  </option>
                  {educationExperts.map((ex) => {
                    const fields = normalizeAssignedFieldsList(ex.assignedFields);
                    return (
                      <option key={ex.id} value={ex.id}>
                        {ex.fullName}
                        {fields.length > 0 ? ` — (${fields.join('، ')})` : ' (همه رشته‌ها)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {props.mode === 'student' && targetMode === 'course_dept_head'
                    ? 'انتخاب مدیر گروه تخصصی درس'
                    : 'انتخاب مدیر گروه رشته مربوطه'}
                </label>
                <select
                  value={selectedDeptHeadId}
                  onChange={(e) => setSelectedDeptHeadId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="">
                    تطبیق خودکار ({suggestedDeptHeads[0]?.fullName || 'مدیر گروه مربوطه'})
                  </option>
                  {deptHeads.map((dh) => {
                    const fields = normalizeAssignedFieldsList(dh.assignedFields);
                    return (
                      <option key={dh.id} value={dh.id}>
                        {dh.fullName}
                        {fields.length > 0 ? ` — گروه: ${fields.join('، ')}` : ' (مدیر گروه عمومی)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {props.mode === 'student' && targetMode === 'course_dept_head' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نام درس تخصصی مرتبط (اختیاری ولی پیشنهادی)
              </label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="مثلاً: ریاضی عمومی ۱، روان‌شناسی تربیتی، کارورزی ۳..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              عنوان / موضوع درخواست *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثلاً: درخواست اخذ هم‌نیاز درس / تاییدیه تطبیق واحد / ارسال به فارغ‌التحصیلان..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              شرح کامل درخواست و جزئیات *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="شرح دقیق درخواست، کد/نام درس یا توضیحات لازم جهت تصمیم‌گیری مدیر گروه و اقدام کارشناس..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs leading-relaxed"
            />
          </div>

          {props.mode === 'staff' && props.actorRole === 'education_expert' && (
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRouteToGraduation}
                onChange={(e) => setAutoRouteToGraduation(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-violet-600"
              />
              <span className="text-xs font-bold text-violet-900 dark:text-violet-200 leading-relaxed">
                پس از تأیید مدیر گروه مربوطه، این درخواست <strong>به‌صورت خودکار</strong> در کارتابل{' '}
                <strong>کارشناس فارغ‌التحصیلان</strong> جهت اقدام نهایی قرار بگیرد.
              </span>
            </label>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {props.mode === 'student'
                  ? 'ثبت و ارسال درخواست در گردش کار'
                  : 'ثبت و ارجاع به کارتابل مدیر گروه'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* نوار فیلتر و جستجو */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو با کد رهگیری (ACW)، موضوع، نام دانشجو یا رشته..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          />
        </div>

        {props.mode === 'staff' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'my_queue', label: `کارتابل اقدام من (${myQueueCount.toLocaleString('fa-IR')})` },
                { id: 'all', label: 'همه درخواست‌های حوزه' },
                { id: 'done', label: 'تکمیل / مختومه‌شده' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStaffFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  staffFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* فهرست درخواست‌ها */}
      {visibleRequests.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {props.mode === 'student'
              ? 'هنوز هیچ درخواست آموزشی ثبت نکرده‌اید.'
              : staffFilter === 'my_queue'
              ? 'در حال حاضر هیچ درخواستی در صف اقدام شما وجود ندارد.'
              : 'درخواستی با این فیلتر یافت نشد.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRequests.map((req) => {
            const stMeta = STAGE_META[req.currentStage];
            const inMyQueue = props.mode === 'staff' && isRequestInMyStaffQueue(req);
            const timelineOpen = expandedTimelineIds[req.id] ?? true;
            const activeActionMode = actionModeById[req.id] || '';
            const matchingExpertsForReq = educationExperts.filter((ex) =>
              doesEducationStaffCoverField(ex, req.studentFieldOfStudy)
            );
            const matchingDeptHeadsForReq = deptHeads.filter((dh) =>
              doesEducationStaffCoverField(dh, req.studentFieldOfStudy)
            );

            return (
              <div
                key={req.id}
                className={`rounded-3xl bg-white dark:bg-slate-900 border p-5 shadow-xs space-y-4 ${
                  inMyQueue
                    ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* ردیف بالای کارت */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-xs font-black"
                        dir="ltr"
                      >
                        {req.trackingCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[11px] font-bold">
                        {ACADEMIC_WORKFLOW_CATEGORY_LABELS[req.category]}
                      </span>
                      {req.courseTitle && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          درس تخصصی: {req.courseTitle}
                        </span>
                      )}
                      {req.autoRouteToGraduationOnDeptApproval && req.currentStage === 'pending_dept_head' && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-200 text-[11px] font-extrabold">
                          مسیر خودکار به فارغ‌التحصیلان پس از تأیید مدیر گروه
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {req.subject}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <span>
                        دانشجو: <strong className="text-slate-800 dark:text-slate-200">{req.studentName}</strong>{' '}
                        (<span className="font-mono">{req.studentId}</span>)
                      </span>
                      <span>
                        رشته: <strong className="text-slate-800 dark:text-slate-200">{req.studentFieldOfStudy}</strong>
                      </span>
                      <span>ورودی: {req.studentEntryTerm}</span>
                      <span>ثبت: {req.createdAt}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold shrink-0 ${stMeta.badgeClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${stMeta.dotClass}`} />
                    <span>{stMeta.label}</span>
                  </span>
                </div>

                {/* متن شرح درخواست */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {req.description}
                </div>

                {/* نمایش برجسته دستور مدیر گروه (در صورت صدور) */}
                {req.deptHeadDirective && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/35 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
                    <div className="font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>
                        دستور اجرایی مدیر گروه ({req.assignedDeptHeadName || 'مدیر گروه'}):
                      </span>
                    </div>
                    <p className="text-indigo-950 dark:text-indigo-100 leading-relaxed whitespace-pre-wrap">
                      {req.deptHeadDirective}
                    </p>
                  </div>
                )}

                {/* نمایش نتیجه نهایی و شماره نامه (در صورت تکمیل) */}
                {(req.finalLetterNumber || req.finalActionNote) && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                      req.currentStage === 'rejected'
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    <div className="font-black flex items-center gap-1.5">
                      {req.currentStage === 'rejected' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                      <span>
                        {req.currentStage === 'rejected' ? 'نتیجه نهایی (عدم تأیید):' : 'نتیجه اقدام نهایی:'}
                      </span>
                      {req.finalLetterNumber && (
                        <span className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900 font-mono font-bold text-[11px]" dir="ltr">
                          شماره نامه: {req.finalLetterNumber}
                        </span>
                      )}
                    </div>
                    {req.finalActionNote && <p className="leading-relaxed">{req.finalActionNote}</p>}
                  </div>
                )}

                {/* پنل اقدام اختصاصی هر نقش (وقتی پرونده در کارتابل اقدام این کاربر است) */}
                {inMyQueue && props.mode === 'staff' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    {/* اقدام مدیر گروه آموزشی */}
                    {props.actorRole === 'department_head' && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActionModeById((p) => ({
                                ...p,
                                [req.id]: p[req.id] === 'approve_grad' ? '' : 'approve_grad',
                              }))
                            }
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer ${
                              activeActionMode === 'approve_grad'
                                ? 'bg-violet-700 text-white shadow-sm'
                                : 'bg-violet-600 hover:bg-violet-700 text-white'
                            }`}
                          >
                            <GraduationCap className="w-4 h-4" />
                            <span>تأیید و ارسال خودکار به کارشناس فارغ‌التحصیلان</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActionModeById((p) => ({
                                ...p,
                                [req.id]: p[req.id] === 'directive_expert' ? '' : 'directive_expert',
                              }))
                            }
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer ${
                              activeActionMode === 'directive_expert'
                                ? 'bg-sky-700 text-white shadow-sm'
                                : 'bg-sky-600 hover:bg-sky-700 text-white'
                            }`}
                          >
                            <Send className="w-4 h-4" />
                            <span>ثبت دستور لازم و ارجاع به کارشناس رشته</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActionModeById((p) => ({
                                ...p,
                                [req.id]: p[req.id] === 'direct_complete' ? '' : 'direct_complete',
                              }))
                            }
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>رسیدگی و تکمیل مستقیم</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActionModeById((p) => ({
                                ...p,
                                [req.id]: p[req.id] === 'reject' ? '' : 'reject',
                              }))
                            }
                            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>عدم تأیید</span>
                          </button>
                        </div>

                        {activeActionMode === 'approve_grad' && (
                          <div className="p-3.5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 space-y-2.5">
                            <p className="text-xs font-bold text-violet-900 dark:text-violet-200">
                              با ثبت این تأیید، درخواست بلافاصله و به‌صورت خودکار در کارتابل «کارشناس واحد فارغ‌التحصیلان» جهت اقدام نهایی قرار می‌گیرد.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={noteById[req.id] || ''}
                                onChange={(e) => setNoteById((p) => ({ ...p, [req.id]: e.target.value }))}
                                placeholder="توضیحات یا پاراف مدیر گروه (اختیاری)..."
                                className="flex-1 px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-900 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleTransition(req, 'dept_head_approve_to_graduation')}
                                className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-extrabold cursor-pointer shrink-0"
                              >
                                ثبت تأیید و ارسال خودکار به فارغ‌التحصیلان
                              </button>
                            </div>
                          </div>
                        )}

                        {activeActionMode === 'directive_expert' && (
                          <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-sky-900 dark:text-sky-200 mb-1">
                                  کارشناس آموزش رشته مقصد:
                                </label>
                                <select
                                  value={targetStaffById[req.id] || ''}
                                  onChange={(e) =>
                                    setTargetStaffById((p) => ({ ...p, [req.id]: e.target.value }))
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-xs font-bold"
                                >
                                  <option value="">
                                    تطبیق خودکار با رشته دانشجو (
                                    {matchingExpertsForReq[0]?.fullName ||
                                      educationExperts[0]?.fullName ||
                                      'کارشناس آموزش'}
                                    )
                                  </option>
                                  {educationExperts.map((ex) => {
                                    const f = normalizeAssignedFieldsList(ex.assignedFields);
                                    return (
                                      <option key={ex.id} value={ex.id}>
                                        {ex.fullName}
                                        {f.length > 0 ? ` — (${f.join('، ')})` : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-sky-900 dark:text-sky-200 mb-1">
                                  یادداشت تکمیلی (اختیاری):
                                </label>
                                <input
                                  type="text"
                                  value={noteById[req.id] || ''}
                                  onChange={(e) => setNoteById((p) => ({ ...p, [req.id]: e.target.value }))}
                                  placeholder="توضیح تکمیلی..."
                                  className="w-full px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-sky-900 dark:text-sky-200 mb-1">
                                دستورات لازم مدیر گروه برای اقدام کارشناس رشته *:
                              </label>
                              <textarea
                                rows={2}
                                value={directiveById[req.id] || ''}
                                onChange={(e) =>
                                  setDirectiveById((p) => ({ ...p, [req.id]: e.target.value }))
                                }
                                placeholder="مثلاً: با اخذ هم‌نیاز درس موافقت می‌شود؛ لطفاً در سامانه گلستان اعمال و به دانشجو اطلاع‌رسانی شود."
                                className="w-full px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-xs"
                              />
                            </div>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleTransition(req, 'dept_head_directive_to_expert')}
                                className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-extrabold cursor-pointer"
                              >
                                ثبت دستور و ارسال به کارشناس آموزش رشته
                              </button>
                            </div>
                          </div>
                        )}

                        {(activeActionMode === 'direct_complete' || activeActionMode === 'reject') && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={noteById[req.id] || ''}
                              onChange={(e) => setNoteById((p) => ({ ...p, [req.id]: e.target.value }))}
                              placeholder={
                                activeActionMode === 'reject'
                                  ? 'علت عدم تأیید درخواست (الزامی)...'
                                  : 'نتیجه رسیدگی و پاسخ نهایی...'
                              }
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleTransition(
                                  req,
                                  activeActionMode === 'reject' ? 'reject' : 'dept_head_complete'
                                )
                              }
                              className={`px-4 py-2 rounded-xl text-white text-xs font-extrabold cursor-pointer shrink-0 ${
                                activeActionMode === 'reject'
                                  ? 'bg-rose-600 hover:bg-rose-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {activeActionMode === 'reject' ? 'ثبت عدم تأیید' : 'تکمیل درخواست'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* اقدام کارشناس آموزش */}
                    {props.actorRole === 'education_expert' && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActionModeById((p) => ({
                                ...p,
                                [req.id]: p[req.id] === 'refer_dh' ? '' : 'refer_dh',
                              }))
                            }
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Users className="w-4 h-4" />
                            <span>ارجاع به مدیر گروه مربوطه</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActionModeById((p) => ({
                                ...p,
                                [req.id]: p[req.id] === 'expert_done' ? '' : 'expert_done',
                              }))
                            }
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>انجام اقدام و تکمیل درخواست</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActionModeById((p) => ({
                                ...p,
                                [req.id]: p[req.id] === 'to_grad' ? '' : 'to_grad',
                              }))
                            }
                            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <GraduationCap className="w-4 h-4" />
                            <span>ارسال به واحد فارغ‌التحصیلان</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActionModeById((p) => ({
                                ...p,
                                [req.id]: p[req.id] === 'reject' ? '' : 'reject',
                              }))
                            }
                            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رد با توضیحات</span>
                          </button>
                        </div>

                        {activeActionMode === 'refer_dh' && (
                          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <select
                                value={targetStaffById[req.id] || ''}
                                onChange={(e) =>
                                  setTargetStaffById((p) => ({ ...p, [req.id]: e.target.value }))
                                }
                                className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-xs font-bold"
                              >
                                <option value="">
                                  تطبیق خودکار ({matchingDeptHeadsForReq[0]?.fullName || deptHeads[0]?.fullName || 'مدیر گروه'})
                                </option>
                                {deptHeads.map((dh) => {
                                  const f = normalizeAssignedFieldsList(dh.assignedFields);
                                  return (
                                    <option key={dh.id} value={dh.id}>
                                      {dh.fullName}
                                      {f.length > 0 ? ` — (${f.join('، ')})` : ''}
                                    </option>
                                  );
                                })}
                              </select>
                              <input
                                type="text"
                                value={noteById[req.id] || ''}
                                onChange={(e) => setNoteById((p) => ({ ...p, [req.id]: e.target.value }))}
                                placeholder="توضیحات ارجاع به مدیر گروه..."
                                className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-xs"
                              />
                            </div>
                            <label className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={autoGradById[req.id] ?? true}
                                onChange={(e) =>
                                  setAutoGradById((p) => ({ ...p, [req.id]: e.target.checked }))
                                }
                                className="w-4 h-4 accent-violet-600"
                              />
                              <span>
                                پس از تأیید مدیر گروه، به‌صورت خودکار به کارتابل کارشناس فارغ‌التحصیلان ارسال شود
                              </span>
                            </label>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleTransition(req, 'refer_to_dept_head')}
                                className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-extrabold cursor-pointer"
                              >
                                ثبت و ارجاع به مدیر گروه
                              </button>
                            </div>
                          </div>
                        )}

                        {(activeActionMode === 'expert_done' ||
                          activeActionMode === 'to_grad' ||
                          activeActionMode === 'reject') && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={noteById[req.id] || ''}
                              onChange={(e) => setNoteById((p) => ({ ...p, [req.id]: e.target.value }))}
                              placeholder={
                                activeActionMode === 'reject'
                                  ? 'علت رد درخواست (الزامی)...'
                                  : activeActionMode === 'to_grad'
                                  ? 'توضیحات ارسال به واحد فارغ‌التحصیلان...'
                                  : 'شرح اقدام انجام‌شده (مثلاً اعمال در سامانه گلستان)...'
                              }
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleTransition(
                                  req,
                                  activeActionMode === 'reject'
                                    ? 'reject'
                                    : activeActionMode === 'to_grad'
                                    ? 'expert_forward_to_graduation'
                                    : 'expert_complete'
                                )
                              }
                              className={`px-4 py-2 rounded-xl text-white text-xs font-extrabold cursor-pointer shrink-0 ${
                                activeActionMode === 'reject'
                                  ? 'bg-rose-600 hover:bg-rose-700'
                                  : activeActionMode === 'to_grad'
                                  ? 'bg-violet-600 hover:bg-violet-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {activeActionMode === 'reject'
                                ? 'ثبت رد درخواست'
                                : activeActionMode === 'to_grad'
                                ? 'ارسال به فارغ‌التحصیلان'
                                : 'ثبت اقدام و تکمیل'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* اقدام کارشناس واحد فارغ‌التحصیلان */}
                    {props.actorRole === 'graduation' && (
                      <div className="space-y-3 p-3.5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                        <div className="text-xs font-black text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4" />
                          <span>اقدام نهایی کارشناس واحد فارغ‌التحصیلان</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={letterNoById[req.id] || ''}
                            onChange={(e) =>
                              setLetterNoById((p) => ({ ...p, [req.id]: e.target.value }))
                            }
                            placeholder="شماره نامه / پیگیری (اختیاری)"
                            dir="ltr"
                            className="px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-900 text-xs font-mono text-left"
                          />
                          <input
                            type="text"
                            value={noteById[req.id] || ''}
                            onChange={(e) => setNoteById((p) => ({ ...p, [req.id]: e.target.value }))}
                            placeholder="توضیحات اقدام نهایی یا علت عودت/رد..."
                            className="sm:col-span-2 px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleTransition(req, 'graduation_complete')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ثبت اقدام نهایی و خاتمه درخواست</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransition(req, 'return_to_expert')}
                            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>عودت به کارشناس آموزش</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransition(req, 'reject')}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>عدم تأیید</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* جدول / تایم‌لاین گردش کار قابل مشاهده */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => toggleTimeline(req.id)}
                    className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      گردش کار مرحله‌به‌مرحله ({(req.steps || []).length.toLocaleString('fa-IR')} مرحله ثبت‌شده)
                    </span>
                    {timelineOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {timelineOpen && (
                    <div className="mt-3 pr-3 border-r-2 border-indigo-200 dark:border-indigo-800 space-y-2.5">
                      {(req.steps || []).map((step, sIdx) => (
                        <div
                          key={step.id}
                          className="relative p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-1"
                        >
                          <span className="absolute -right-[19px] top-3.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-black text-slate-900 dark:text-white">
                                {(sIdx + 1).toLocaleString('fa-IR')}. {step.actionLabel}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {step.timestamp}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-3 gap-y-0.5">
                            <span>
                              اقدام‌کننده: <strong>{step.actorName}</strong> ({ACTOR_ROLE_LABELS[step.actorRole]})
                            </span>
                            {step.targetStaffName && (
                              <span>
                                گیرنده مرحله بعد: <strong className="text-indigo-700 dark:text-indigo-300">{step.targetStaffName}</strong>
                              </span>
                            )}
                          </div>
                          {step.directive && (
                            <div className="text-[11px] px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
                              <strong>دستور مدیر گروه:</strong> {step.directive}
                            </div>
                          )}
                          {step.note && (
                            <div className="text-[11px] text-slate-700 dark:text-slate-300">
                              توضیحات: {step.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
