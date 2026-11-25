import React, { useMemo, useState } from 'react';
import {
  AcademicDeputyStaff,
  AppSettings,
  EducationStaff,
  GraduationStaff,
  Message,
  Student,
} from '../types';
import {
  Storage,
  doesEducationStaffCoverField,
  getEducationStaffRoleLabel,
  isEducationDepartmentHead,
  normalizeAssignedFieldsList,
} from '../utils/storage';
import { calculateOfferingBreakdown, checkScheduleViewLock } from '../utils/schedulingUtils';
import { EducationDashboard } from './EducationDashboard';
import { GraduationDashboard } from './GraduationDashboard';
import { AcademicWorkflowPanel } from './AcademicWorkflowPanel';
import { CourseSchedulingWorkspace } from './CourseSchedulingWorkspace';
import {
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Mail,
  Maximize2,
  PackagePlus,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';

interface AcademicDeputyHubProps {
  role: 'education' | 'graduation' | 'academic_deputy';
  educationStaff?: EducationStaff;
  graduationStaff?: GraduationStaff;
  academicDeputyStaff?: AcademicDeputyStaff;
  students: Student[];
  messages: Message[];
  settings: AppSettings;
  cloudSyncTick?: number;
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenUserGuide: (role?: 'education' | 'graduation' | 'academic_deputy') => void;
}

export const AcademicDeputyHub: React.FC<AcademicDeputyHubProps> = ({
  role,
  educationStaff,
  graduationStaff,
  academicDeputyStaff,
  students,
  messages,
  settings,
  cloudSyncTick,
  onRefreshData,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  const [hubTab, setHubTab] = useState<'panel' | 'workflow' | 'directory'>('panel');
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);

  const isDeptHead = role === 'education' && educationStaff ? isEducationDepartmentHead(educationStaff) : false;
  const canOpenCourseScheduling = role === 'academic_deputy' || isDeptHead;
  const actorWorkflowRole: 'department_head' | 'education_expert' | 'graduation' =
    role === 'graduation'
      ? 'graduation'
      : isDeptHead || role === 'academic_deputy'
      ? 'department_head'
      : 'education_expert';

  const currentStaff =
    role === 'academic_deputy'
      ? academicDeputyStaff
      : role === 'education'
      ? educationStaff
      : graduationStaff;
  const assignedFields = useMemo(
    () => (educationStaff ? normalizeAssignedFieldsList(educationStaff.assignedFields) : []),
    [educationStaff]
  );

  const allAcademicDeputyStaff = useMemo(
    () => Storage.getAcademicDeputyStaff().filter((a) => a.status !== 'inactive' && a.isActive !== false),
    [cloudSyncTick, messages]
  );
  const allEducationStaff = useMemo(
    () => Storage.getEducationStaff().filter((e) => e.status !== 'inactive' && e.isActive !== false),
    [cloudSyncTick, messages]
  );
  const allGraduationStaff = useMemo(
    () => Storage.getGraduationStaff().filter((g) => g.status !== 'inactive' && g.isActive !== false),
    [cloudSyncTick, messages]
  );

  const deptHeads = useMemo(
    () => allEducationStaff.filter((e) => isEducationDepartmentHead(e)),
    [allEducationStaff]
  );
  const educationExperts = useMemo(
    () => allEducationStaff.filter((e) => !isEducationDepartmentHead(e)),
    [allEducationStaff]
  );

  const schedViewLock = useMemo(() => {
    const rules = Storage.getSchedRules();
    const mappedRole = role === 'academic_deputy' ? 'academic_deputy' : 'department_head';
    return checkScheduleViewLock(rules, mappedRole, currentStaff?.id || '');
  }, [role, currentStaff?.id, cloudSyncTick, isSchedulingOpen]);

  const schedStats = useMemo(() => {
    const rules = Storage.getSchedRules();
    const activeTerm = rules.activeTerm || '4041';
    const classrooms = Storage.getSchedClassrooms();
    const programs = Storage.getSchedPrograms();
    const professors = Storage.getSchedProfessors();
    const courses = Storage.getSchedCourses();
    const offerings = Storage.getSchedOfferings().filter((o) => o.termKey === activeTerm);
    const totalWeeklyHours = offerings.reduce((sum, o) => sum + calculateOfferingBreakdown(o, rules).weeklyHours, 0);
    const totalEqUnits = offerings.reduce((sum, o) => sum + calculateOfferingBreakdown(o, rules).equivalentUnits, 0);
    return {
      activeTerm,
      classroomsCount: classrooms.length,
      programsCount: programs.length,
      professorsCount: professors.length,
      coursesCount: courses.length,
      offeringsCount: offerings.length,
      totalWeeklyHours,
      totalEqUnits: Math.round(totalEqUnits * 100) / 100,
    };
  }, [cloudSyncTick, isSchedulingOpen]);

  const pendingMyWorkflowCount = useMemo(() => {
    const all = Storage.getAcademicWorkflowRequests();
    if (!currentStaff) return 0;
    if (role === 'academic_deputy') {
      return all.filter(
        (r) =>
          r.currentStage === 'pending_dept_head' ||
          r.currentStage === 'pending_expert_action' ||
          r.currentStage === 'pending_graduation'
      ).length;
    }
    if (actorWorkflowRole === 'graduation') {
      return all.filter((r) => r.currentStage === 'pending_graduation').length;
    }
    if (actorWorkflowRole === 'department_head' && educationStaff) {
      return all.filter(
        (r) =>
          r.currentStage === 'pending_dept_head' &&
          (r.assignedDeptHeadId === educationStaff.id ||
            (!r.assignedDeptHeadId &&
              (assignedFields.length === 0 ||
                doesEducationStaffCoverField(educationStaff, r.studentFieldOfStudy))))
      ).length;
    }
    if (educationStaff) {
      return all.filter(
        (r) =>
          r.currentStage === 'pending_expert_action' &&
          (r.assignedExpertId === educationStaff.id ||
            (!r.assignedExpertId &&
              (assignedFields.length === 0 ||
                doesEducationStaffCoverField(educationStaff, r.studentFieldOfStudy))))
      ).length;
    }
    return 0;
  }, [role, actorWorkflowRole, currentStaff, educationStaff, assignedFields, cloudSyncTick, messages]);

  const pendingClearanceForMeCount = useMemo(() => {
    const all = Storage.getGraduationClearances();
    if (role === 'academic_deputy') {
      return all.filter((c) => !c.graduationFinalized).length;
    }
    if (role === 'graduation') {
      return all.filter((c) => c.status === 'completed' && !c.graduationFinalized).length;
    }
    if (!educationStaff) return 0;
    const targetStatus = isDeptHead ? 'pending_dept_head' : 'pending_education';
    const matching = all.filter((c) => c.status === targetStatus);
    if (assignedFields.length === 0) return matching.length;
    return matching.filter((c) => doesEducationStaffCoverField(educationStaff, c.studentFieldOfStudy)).length;
  }, [role, educationStaff, isDeptHead, assignedFields, cloudSyncTick, messages]);

  const roleBadgeLabel =
    role === 'academic_deputy'
      ? academicDeputyStaff?.title || 'معاونت آموزشی پردیس'
      : role === 'graduation'
      ? 'کارشناس واحد فارغ‌التحصیلان'
      : educationStaff
      ? getEducationStaffRoleLabel(educationStaff)
      : 'حوزه آموزش';

  if (!currentStaff) return null;

  return (
    <div className="space-y-5">
      {/* نوار یکپارچه حوزه معاونت آموزشی */}
      <div className="rounded-3xl bg-gradient-to-l from-slate-900 via-indigo-950 to-sky-950 text-white p-5 sm:p-6 shadow-xl border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shrink-0">
              <GraduationCap className="w-7 h-7 text-amber-300" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-400/20 border border-amber-300/30 text-amber-200 text-[11px] font-black">
                  حوزه معاونت آموزشی
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white/15 text-white text-[11px] font-extrabold">
                  {roleBadgeLabel}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight">
                داشبورد یکپارچه حوزه معاونت آموزشی — {currentStaff.fullName}
              </h1>
              <p className="text-xs text-sky-100/85 leading-relaxed">
                دسترسی یکپارچه مدیران گروه، کارشناسان آموزش و کارشناسان واحد فارغ‌التحصیلان به پنل اختصاصی، گردش کار و ارجاعات دوجانبه و تبادل سریع اطلاعات.
                {assignedFields.length > 0 && (
                  <span className="mr-1.5 text-amber-200 font-bold">
                    • رشته‌های تحت پوشش: {assignedFields.join('، ')}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* آمار زنده صف کارتابل */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setHubTab('workflow')}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-center transition cursor-pointer"
            >
              <div className="text-lg font-black tabular-nums text-amber-300">
                {pendingMyWorkflowCount.toLocaleString('fa-IR')}
              </div>
              <div className="text-[10px] font-bold text-sky-100">ارجاع در صف من</div>
            </button>
            <button
              type="button"
              onClick={() => setHubTab('panel')}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-center transition cursor-pointer"
            >
              <div className="text-lg font-black tabular-nums text-emerald-300">
                {pendingClearanceForMeCount.toLocaleString('fa-IR')}
              </div>
              <div className="text-[10px] font-bold text-sky-100">
                {role === 'academic_deputy'
                  ? 'تسویه در جریان کل'
                  : role === 'graduation'
                  ? 'تسویه آماده خاتمه'
                  : isDeptHead
                  ? 'تسویه (گزارش ۱۰۵۰)'
                  : 'تسویه (دروازه آموزش)'}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setHubTab('directory')}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-center transition cursor-pointer"
            >
              <div className="text-lg font-black tabular-nums text-sky-200">
                {(allAcademicDeputyStaff.length + deptHeads.length + educationExperts.length + allGraduationStaff.length).toLocaleString('fa-IR')}
              </div>
              <div className="text-[10px] font-bold text-sky-100">اعضای معاونت آموزشی</div>
            </button>
          </div>
        </div>

        {/* تب‌های سطح اول داشبورد یکپارچه */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setHubTab('panel')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              hubTab === 'panel'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>پنل اختصاصی من ({roleBadgeLabel})</span>
            {pendingClearanceForMeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {pendingClearanceForMeCount.toLocaleString('fa-IR')}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setHubTab('workflow')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              hubTab === 'workflow'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>گردش کار و ارجاعات آموزشی / فارغ‌التحصیلان</span>
            {pendingMyWorkflowCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                {pendingMyWorkflowCount.toLocaleString('fa-IR')} جدید
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setHubTab('directory')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
              hubTab === 'directory'
                ? 'bg-teal-400 text-slate-950 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>تبادل اطلاعات و اعضای حوزه معاونت آموزشی</span>
          </button>

          {canOpenCourseScheduling && (
            <button
              type="button"
              onClick={() => setIsSchedulingOpen(true)}
              className={`mr-auto px-4 py-2.5 rounded-2xl text-xs font-black inline-flex items-center gap-2 shadow-lg transition cursor-pointer ${
                schedViewLock.locked
                  ? 'bg-rose-500/25 hover:bg-rose-500/35 text-rose-100 border border-rose-400/50 shadow-rose-900/20'
                  : 'bg-gradient-to-l from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/25'
              }`}
            >
              {schedViewLock.locked ? <Lock className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
              <span>
                {schedViewLock.locked
                  ? 'برنامه‌ریزی درسی (مسدودشده)'
                  : 'برنامه‌ریزی درسی جامع (تمام‌صفحه)'}
              </span>
              {!schedViewLock.locked && <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {(role === 'academic_deputy' || role === 'graduation') && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('cfuis:open-warehouse-request'))}
              className={`${canOpenCourseScheduling ? '' : 'mr-auto '}px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer`}
            >
              <PackagePlus className="w-4 h-4 text-amber-300" />
              <span>درخواست از انبار</span>
            </button>
          )}
        </div>
      </div>

      {/* تب ۱: پنل اختصاصی هر نقش */}
      {hubTab === 'panel' && (
        <>
          {role === 'academic_deputy' && academicDeputyStaff && (
            <div className="space-y-5">
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 p-6 shadow-sm space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-black">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>میز کار مدیریتی معاونت آموزشی</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      سامانه متمرکز برنامه‌ریزی درسی، قوانین آموزشی و گزارش‌های تحلیلی
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                      از این میز کار می‌توانید به فضای تمام‌صفحه برنامه‌ریزی درسی وارد شوید و اطلاعات پایه (کلاس‌ها، رشته‌ها، ورودی‌ها، اساتید، سرفصل دروس ۷ رقمی)، برنامه هفتگی تعاملی، زمان‌بند هوشمند و ۷ گزارش تخصصی قابل چاپ را مدیریت کنید.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSchedulingOpen(true)}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-l from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs sm:text-sm font-black inline-flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
                    >
                      <CalendarDays className="w-5 h-5" />
                      <span>ورود به برنامه‌ریزی درسی جامع (تمام‌صفحه)</span>
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onOpenMessages}
                      className="px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>پیام‌ها و مکاتبات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('cfuis:open-warehouse-request'))}
                      className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span>درخواست از انبار</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenUserGuide('academic_deputy')}
                      className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>راهنمای کاربری</span>
                    </button>
                  </div>
                </div>

                {schedViewLock.locked ? (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-extrabold flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{schedViewLock.reason}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60">
                      <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">ترم فعال برنامه‌ریزی</div>
                      <div className="text-xl font-black text-indigo-950 dark:text-white mt-1 tabular-nums">{schedStats.activeTerm}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/60">
                      <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300">ارائه‌های ثبت‌شده ترم</div>
                      <div className="text-xl font-black text-sky-950 dark:text-white mt-1 tabular-nums">{schedStats.offeringsCount.toLocaleString('fa-IR')}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60">
                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">ساعات هفتگی / واحد معادل</div>
                      <div className="text-lg font-black text-emerald-950 dark:text-white mt-1 tabular-nums">
                        {schedStats.totalWeeklyHours.toLocaleString('fa-IR')} س / {schedStats.totalEqUnits.toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60">
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">اساتید ثبت‌شده</div>
                      <div className="text-xl font-black text-amber-950 dark:text-white mt-1 tabular-nums">{schedStats.professorsCount.toLocaleString('fa-IR')} نفر</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/70 dark:border-violet-900/60">
                      <div className="text-[11px] font-bold text-violet-700 dark:text-violet-300">رشته‌ها و ورودی‌ها</div>
                      <div className="text-xl font-black text-violet-950 dark:text-white mt-1 tabular-nums">{schedStats.programsCount.toLocaleString('fa-IR')}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/60">
                      <div className="text-[11px] font-bold text-teal-700 dark:text-teal-300">کلاس‌ها / دروس سرفصل</div>
                      <div className="text-lg font-black text-teal-950 dark:text-white mt-1 tabular-nums">
                        {schedStats.classroomsCount.toLocaleString('fa-IR')} / {schedStats.coursesCount.toLocaleString('fa-IR')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {role === 'education' && educationStaff && (
            <EducationDashboard
              staff={educationStaff}
              students={students}
              messages={messages}
              settings={settings}
              cloudSyncTick={cloudSyncTick}
              onRefreshData={onRefreshData}
              onOpenMessages={onOpenMessages}
              onOpenUserGuide={(r) => onOpenUserGuide(r || 'education')}
            />
          )}
          {role === 'graduation' && graduationStaff && (
            <GraduationDashboard
              staff={graduationStaff}
              messages={messages}
              settings={settings}
              onDataChange={onRefreshData}
              onOpenMessages={onOpenMessages}
              onOpenUserGuide={(r) => onOpenUserGuide(r || 'graduation')}
            />
          )}
        </>
      )}

      {/* تب ۲: گردش کار و ارجاعات یکپارچه */}
      {hubTab === 'workflow' && (
        <AcademicWorkflowPanel
          mode="staff"
          actorRole={actorWorkflowRole}
          staff={(currentStaff as EducationStaff | GraduationStaff)}
          students={students}
          cloudSyncTick={cloudSyncTick}
          onDataChange={onRefreshData}
        />
      )}

      {/* تب ۳: دایرکتوری و تبادل سریع اطلاعات بین مدیران گروه، کارشناسان آموزش و کارشناسان فارغ‌التحصیلان */}
      {hubTab === 'directory' && (
        <div className="space-y-5">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                اعضای فعال حوزه معاونت آموزشی و ارتباط مستقیم
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                فهرست کامل مدیران گروه، کارشناسان آموزش و کارشناسان واحد فارغ‌التحصیلان جهت هماهنگی سریع، ارسال پیام داخلی یا ثبت ارجاع در گردش کار
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenMessages}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>ارسال پیام داخلی به همکاران</span>
              </button>
              <button
                type="button"
                onClick={() => setHubTab('workflow')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <GitBranch className="w-4 h-4" />
                <span>ورود به میز ارجاعات</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* ستون ۱: مدیران گروه آموزشی */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    مدیران گروه آموزشی
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs font-black">
                  {deptHeads.length.toLocaleString('fa-IR')} نفر
                </span>
              </div>

              {deptHeads.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  هنوز مدیر گروه فعالی ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {deptHeads.map((dh) => {
                    const fields = normalizeAssignedFieldsList(dh.assignedFields);
                    return (
                      <div
                        key={dh.id}
                        className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/50 space-y-1 text-xs"
                      >
                        <div className="font-black text-slate-900 dark:text-white flex items-center justify-between gap-2">
                          <span>{dh.fullName}</span>
                          {dh.id === currentStaff.id && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                              شما
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-indigo-800 dark:text-indigo-300 font-semibold">
                          رشته‌ها: {fields.length > 0 ? fields.join('، ') : 'عمومی / همه رشته‌ها'}
                        </div>
                        {dh.phone && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono" dir="ltr">
                            <Phone className="w-3 h-3" />
                            <span>{dh.phone}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ستون ۲: کارشناسان آموزش */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    کارشناسان آموزش
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 text-xs font-black">
                  {educationExperts.length.toLocaleString('fa-IR')} نفر
                </span>
              </div>

              {educationExperts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  هنوز کارشناس آموزش فعالی ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {educationExperts.map((ex) => {
                    const fields = normalizeAssignedFieldsList(ex.assignedFields);
                    return (
                      <div
                        key={ex.id}
                        className="p-3 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/50 space-y-1 text-xs"
                      >
                        <div className="font-black text-slate-900 dark:text-white flex items-center justify-between gap-2">
                          <span>{ex.fullName}</span>
                          {ex.id === currentStaff.id && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-600 text-white">
                              شما
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-sky-800 dark:text-sky-300 font-semibold">
                          رشته‌ها: {fields.length > 0 ? fields.join('، ') : 'همه رشته‌ها'}
                        </div>
                        {ex.phone && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono" dir="ltr">
                            <Phone className="w-3 h-3" />
                            <span>{ex.phone}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ستون ۳: کارشناسان واحد فارغ‌التحصیلان */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-violet-200/80 dark:border-violet-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    کارشناسان واحد فارغ‌التحصیلان
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-200 text-xs font-black">
                  {allGraduationStaff.length.toLocaleString('fa-IR')} نفر
                </span>
              </div>

              {allGraduationStaff.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  هنوز کارشناس فارغ‌التحصیلان فعالی ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {allGraduationStaff.map((gr) => (
                    <div
                      key={gr.id}
                      className="p-3 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-900/50 space-y-1 text-xs"
                    >
                      <div className="font-black text-slate-900 dark:text-white flex items-center justify-between gap-2">
                        <span>{gr.fullName}</span>
                        {gr.id === currentStaff.id && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600 text-white">
                            شما
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-violet-800 dark:text-violet-300 font-semibold">
                        {gr.department || 'اداره امور فارغ‌التحصیلان'}
                      </div>
                      {gr.phone && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono" dir="ltr">
                          <Phone className="w-3 h-3" />
                          <span>{gr.phone}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {canOpenCourseScheduling && (
        <CourseSchedulingWorkspace
          isOpen={isSchedulingOpen}
          onClose={() => setIsSchedulingOpen(false)}
          userRole={role === 'academic_deputy' ? 'academic_deputy' : 'department_head'}
          actor={{ id: currentStaff.id, name: currentStaff.fullName }}
          allowedMajorNames={role === 'education' ? assignedFields : undefined}
          onDataUpdated={onRefreshData}
        />
      )}
    </div>
  );
};
