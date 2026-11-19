import React, { useMemo, useState } from 'react';
import {
  AppSettings,
  Message,
  SmartCampusStaff,
  Student,
} from '../types';
import { Storage } from '../utils/storage';
import { GraduationClearanceReviewPanel } from './GraduationClearanceReviewPanel';
import {
  DEFAULT_STUDENT_PAGE_SIZE,
  StudentListPaginationBar,
  getPaginationMeta,
} from './StudentListPaginationBar';
import {
  Cpu,
  Users,
  AlertTriangle,
  FileCheck2,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  X,
  BellRing,
  Phone,
} from 'lucide-react';

interface SmartCampusDashboardProps {
  staff: SmartCampusStaff;
  students: Student[];
  messages: Message[];
  settings: AppSettings;
  onDataChange: () => void;
  onOpenMessages?: () => void;
}

// نوع محدود و امن برای دانشجو — فقط فیلدهای مجاز کاربر هوشمندسازی
type SafeSmartStudent = Pick<
  Student,
  'studentId' | 'fullName' | 'fieldOfStudy' | 'entryTerm' | 'mobile' | 'phone'
>;

export const SmartCampusDashboard: React.FC<SmartCampusDashboardProps> = ({
  staff,
  students,
  messages,
  settings,
  onDataChange,
  onOpenMessages,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'warnings' | 'clearance' | 'messages'>('students');
  const [refreshTick, setRefreshTick] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // فیلتر فهرست دانشجویان
  const [studentSearch, setStudentSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState<number | 'all'>(DEFAULT_STUDENT_PAGE_SIZE);

  // فیلتر اخطارها
  const [warningSearch, setWarningSearch] = useState('');
  const [warningFilter, setWarningFilter] = useState<'all' | 'active' | 'resolved'>('all');

  // مودال پیام یا اخطار (فردی / گروهی)
  const [actionModal, setActionModal] = useState<{
    kind: 'message' | 'warning';
    mode: 'single' | 'filtered';
    targetStudent?: SafeSmartStudent;
  } | null>(null);
  const [actionTitle, setActionTitle] = useState('');
  const [actionBody, setActionBody] = useState('');
  const [warningSeverity, setWarningSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  // پاسخ سریع در تب پیام‌ها
  const [replyByMsgId, setReplyByMsgId] = useState<Record<string, string>>({});

  // استخراج صرفاً فیلدهای مجاز (کد دانشجویی، نام و نام خانوادگی، رشته، ورودی، تلفن تماس)
  const safeStudents: SafeSmartStudent[] = useMemo(
    () =>
      students.map((s) => ({
        studentId: s.studentId,
        fullName: s.fullName,
        fieldOfStudy: s.fieldOfStudy,
        entryTerm: s.entryTerm,
        mobile: s.mobile,
        phone: s.phone,
      })),
    [students]
  );

  const smartWarnings = useMemo(() => {
    void refreshTick;
    return Storage.getStudentEvaluations().filter((e) => e.evaluatorRole === 'smart_campus');
  }, [refreshTick]);

  const smartMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          m.receiverType === 'smart_campus' ||
          m.senderRole === 'smart_campus' ||
          m.category === 'smart_campus'
      ),
    [messages]
  );

  const pendingClearanceCount = useMemo(() => {
    void refreshTick;
    return Storage.getGraduationClearances().filter(
      (c) =>
        c.educationGateStatus === 'approved' &&
        (c.units?.smart_campus?.status || 'pending') === 'pending'
    ).length;
  }, [refreshTick]);

  const fieldsList = useMemo(() => {
    const s = new Set<string>();
    safeStudents.forEach((st) => st.fieldOfStudy && s.add(st.fieldOfStudy));
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [safeStudents]);

  const termsList = useMemo(() => {
    const s = new Set<string>();
    safeStudents.forEach((st) => st.entryTerm && s.add(st.entryTerm));
    return Array.from(s).sort((a, b) => b.localeCompare(a, 'fa'));
  }, [safeStudents]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return safeStudents.filter((st) => {
      if (fieldFilter !== 'all' && st.fieldOfStudy !== fieldFilter) return false;
      if (termFilter !== 'all' && st.entryTerm !== termFilter) return false;
      if (!q) return true;
      return [st.studentId, st.fullName, st.fieldOfStudy, st.entryTerm, st.mobile || '', st.phone || '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [safeStudents, studentSearch, fieldFilter, termFilter]);

  const { startIndex, endIndex } = getPaginationMeta(
    filteredStudents.length,
    studentPage,
    studentPageSize
  );
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const filteredWarnings = useMemo(() => {
    const q = warningSearch.trim().toLowerCase();
    return smartWarnings.filter((w) => {
      if (warningFilter === 'active' && w.resolved) return false;
      if (warningFilter === 'resolved' && !w.resolved) return false;
      if (!q) return true;
      return [w.studentName, w.studentId, w.title, w.description].join(' ').toLowerCase().includes(q);
    });
  }, [smartWarnings, warningFilter, warningSearch]);

  const activeWarningsCount = smartWarnings.filter((w) => !w.resolved).length;

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const triggerRefresh = () => {
    setRefreshTick((t) => t + 1);
    onDataChange();
  };

  const openActionModal = (
    kind: 'message' | 'warning',
    mode: 'single' | 'filtered',
    targetStudent?: SafeSmartStudent
  ) => {
    setActionModal({ kind, mode, targetStudent });
    setActionTitle(kind === 'warning' ? 'اخطار واحد هوشمندسازی و سامانه کارت هوشمند' : '');
    setActionBody('');
    setWarningSeverity('medium');
  };

  const handleSubmitAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal || !actionTitle.trim() || !actionBody.trim()) {
      showToast('error', 'لطفاً عنوان و متن را کامل وارد نمایید.');
      return;
    }

    const targets: SafeSmartStudent[] =
      actionModal.mode === 'single' && actionModal.targetStudent
        ? [actionModal.targetStudent]
        : filteredStudents;

    if (targets.length === 0) {
      showToast('error', 'هیچ دانشجویی برای انجام این عملیات انتخاب نشده است.');
      return;
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    if (actionModal.kind === 'message') {
      targets.forEach((st) => {
        Storage.addMessage({
          senderId: staff.id,
          senderName: `${staff.fullName} (واحد هوشمندسازی)`,
          senderRole: 'smart_campus',
          receiverType: 'student',
          receiverId: st.studentId,
          receiverName: st.fullName,
          targetScope: 'single',
          category: 'smart_campus',
          subject: actionTitle.trim(),
          content: actionBody.trim(),
          date: nowStr,
        });
      });
      showToast(
        'success',
        targets.length === 1
          ? `پیام واحد هوشمندسازی برای «${targets[0].fullName}» ارسال شد.`
          : `پیام واحد هوشمندسازی برای ${targets.length.toLocaleString('fa-IR')} دانشجو ارسال شد.`
      );
    } else {
      targets.forEach((st) => {
        Storage.addStudentEvaluation({
          studentId: st.studentId,
          studentName: st.fullName,
          scope: 'individual',
          type: 'warning',
          severity: warningSeverity,
          title: actionTitle.trim(),
          description: actionBody.trim(),
          evaluatorId: staff.id,
          evaluatorName: `${staff.fullName} (واحد هوشمندسازی)`,
          evaluatorRole: 'smart_campus',
        });
        // ارسال همزمان اعلان به صندوق پیام دانشجو جهت اطلاع فوری
        Storage.addMessage({
          senderId: staff.id,
          senderName: `${staff.fullName} (واحد هوشمندسازی)`,
          senderRole: 'smart_campus',
          receiverType: 'student',
          receiverId: st.studentId,
          receiverName: st.fullName,
          targetScope: 'single',
          category: 'smart_campus',
          subject: `اخطار هوشمندسازی: ${actionTitle.trim()}`,
          content: actionBody.trim(),
          date: nowStr,
        });
      });
      showToast(
        'success',
        targets.length === 1
          ? `اخطار واحد هوشمندسازی برای «${targets[0].fullName}» ثبت و ارسال شد.`
          : `اخطار واحد هوشمندسازی برای ${targets.length.toLocaleString('fa-IR')} دانشجو ثبت و ارسال شد.`
      );
    }

    setActionModal(null);
    setActionTitle('');
    setActionBody('');
    triggerRefresh();
  };

  const handleResolveWarning = (id: string) => {
    Storage.resolveStudentEvaluation(id);
    showToast('success', 'وضعیت اخطار به رفع‌شده تغییر یافت.');
    triggerRefresh();
  };

  const handleDeleteWarning = (id: string) => {
    Storage.deleteStudentEvaluation(id);
    showToast('success', 'رکورد اخطار حذف شد.');
    triggerRefresh();
  };

  const handleQuickReply = (msgId: string) => {
    const text = (replyByMsgId[msgId] || '').trim();
    if (!text) return;
    Storage.replyToMessage(msgId, {
      senderName: `${staff.fullName} (واحد هوشمندسازی)`,
      senderRole: 'smart_campus',
      content: text,
      date: `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    });
    setReplyByMsgId((prev) => ({ ...prev, [msgId]: '' }));
    showToast('success', 'پاسخ ارسال شد.');
    triggerRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* سربرگ کارتابل هوشمندسازی */}
      <div className="rounded-3xl bg-gradient-to-l from-cyan-900 via-sky-900 to-slate-900 text-white p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Cpu className="w-7 h-7 text-cyan-300" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-white/15 text-[11px] font-bold text-cyan-100 mb-1">
                کارتابل واحد هوشمندسازی و فناوری • سامانه جامع امور دانشجویی
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                خوش آمدید، {staff.fullName}
              </h1>
              <p className="text-xs text-cyan-100/85 mt-1">
                ارسال پیام و ثبت اخطار فردی یا گروهی به دانشجویان، پیگیری تخلفات/نواقص تجهیزات هوشمند و تایید تسویه حساب فارغ‌التحصیلان
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openActionModal('warning', 'filtered')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <BellRing className="w-4 h-4" />
              <span>ثبت اخطار گروهی ({filteredStudents.length.toLocaleString('fa-IR')})</span>
            </button>
            <button
              type="button"
              onClick={() => openActionModal('message', 'filtered')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>پیام گروهی</span>
            </button>
          </div>
        </div>

        {/* آمار */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="rounded-2xl bg-white/10 border border-white/15 p-3.5">
            <div className="text-xs text-cyan-100/80 font-bold">کل دانشجویان قابل دسترسی</div>
            <div className="text-2xl font-black tabular-nums mt-1">
              {safeStudents.length.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-3.5">
            <div className="text-xs text-cyan-100/80 font-bold">اخطارهای فعال ثبت‌شده</div>
            <div className="text-2xl font-black tabular-nums mt-1 text-amber-300">
              {activeWarningsCount.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-3.5">
            <div className="text-xs text-cyan-100/80 font-bold">تسویه فارغ‌التحصیلان منتظر</div>
            <div className="text-2xl font-black tabular-nums mt-1 text-cyan-300">
              {pendingClearanceCount.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-3.5">
            <div className="text-xs text-cyan-100/80 font-bold">پیام‌های هوشمندسازی</div>
            <div className="text-2xl font-black tabular-nums mt-1 text-emerald-300">
              {smartMessages.length.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>
      </div>

      {/* اعلان سیاست حریم خصوصی */}
      <div className="px-4 py-2.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-800/60 text-xs text-cyan-900 dark:text-cyan-200 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
        <span>
          سطح دسترسی اطلاعات دانشجویی این کارتابل مطابق سیاست محرمانگی، صرفاً شامل{' '}
          <strong>کد دانشجویی، نام و نام خانوادگی، رشته، ورودی و شماره تماس</strong> می‌باشد.
        </span>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* تب‌ها */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'students', label: 'فهرست دانشجویان، پیام و اخطار', icon: Users, badge: 0 },
          { id: 'warnings', label: 'اخطارها و تذکرات ثبت‌شده', icon: AlertTriangle, badge: activeWarningsCount },
          { id: 'clearance', label: 'تسویه حساب فارغ‌التحصیلان', icon: FileCheck2, badge: pendingClearanceCount },
          { id: 'messages', label: 'پیام‌های هوشمندسازی', icon: MessageSquare, badge: smartMessages.filter((m) => m.status === 'pending' && m.receiverType === 'smart_campus').length },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
                active
                  ? 'bg-cyan-700 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300'
                  }`}
                >
                  {tab.badge.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* تب ۱: فهرست دانشجویان با دسترسی محدود و صفحه‌بندی ۵۰تایی */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setStudentPage(1);
                  }}
                  placeholder="جستجو بر اساس نام، کد دانشجویی، رشته، ورودی یا شماره تماس..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <select
                value={fieldFilter}
                onChange={(e) => {
                  setFieldFilter(e.target.value);
                  setStudentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه رشته‌ها</option>
                {fieldsList.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <select
                value={termFilter}
                onChange={(e) => {
                  setTermFilter(e.target.value);
                  setStudentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه ورودی‌ها</option>
                {termsList.map((t) => (
                  <option key={t} value={t}>
                    ورودی {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <StudentListPaginationBar
            totalItems={filteredStudents.length}
            currentPage={studentPage}
            pageSize={studentPageSize}
            onPageChange={setStudentPage}
            onPageSizeChange={setStudentPageSize}
          />

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-extrabold">کد دانشجویی</th>
                    <th className="px-4 py-3 font-extrabold">نام و نام خانوادگی</th>
                    <th className="px-4 py-3 font-extrabold">رشته تحصیلی</th>
                    <th className="px-4 py-3 font-extrabold">ورودی</th>
                    <th className="px-4 py-3 font-extrabold">شماره تماس</th>
                    <th className="px-4 py-3 font-extrabold text-center">اخطار فعال</th>
                    <th className="px-4 py-3 font-extrabold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStudents.map((st) => {
                    const stWarnings = smartWarnings.filter(
                      (w) => w.studentId === st.studentId && !w.resolved
                    ).length;
                    return (
                      <tr key={st.studentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200" dir="ltr">
                          {st.studentId}
                        </td>
                        <td className="px-4 py-3 font-black text-slate-900 dark:text-white">
                          {st.fullName}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{st.fieldOfStudy}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{st.entryTerm}</td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200" dir="ltr">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {st.mobile || st.phone || '---'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {stWarnings > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-black">
                              {stWarnings.toLocaleString('fa-IR')} مورد
                            </span>
                          ) : (
                            <span className="text-slate-400">ندارد</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openActionModal('message', 'single', st)}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>پیام</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openActionModal('warning', 'single', st)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>اخطار</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* تب ۲: اخطارهای ثبت‌شده */}
      {activeTab === 'warnings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={warningSearch}
                onChange={(e) => setWarningSearch(e.target.value)}
                placeholder="جستجوی اخطار بر اساس نام دانشجو، شماره دانشجویی یا متن..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'همه' },
                  { id: 'active', label: 'فعال' },
                  { id: 'resolved', label: 'رفع‌شده' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setWarningFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    warningFilter === f.id
                      ? 'bg-cyan-700 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredWarnings.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-xs text-slate-500">
              اخطاری توسط واحد هوشمندسازی در این فیلتر ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWarnings.map((w) => (
                <div
                  key={w.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{w.title}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                        {w.studentName} (<span className="font-mono" dir="ltr">{w.studentId}</span>)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          w.resolved
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : w.severity === 'high'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}
                      >
                        {w.resolved ? 'رفع‌شده' : w.severity === 'high' ? 'فوری' : w.severity === 'low' ? 'عادی' : 'مهم'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{w.description}</p>
                    <p className="text-[11px] text-slate-500">
                      ثبت‌شده توسط {w.evaluatorName} • {w.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!w.resolved && (
                      <button
                        type="button"
                        onClick={() => handleResolveWarning(w.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>رفع اخطار</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteWarning(w.id)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="حذف اخطار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* تب ۳: تسویه حساب فارغ‌التحصیلان */}
      {activeTab === 'clearance' && (
        <GraduationClearanceReviewPanel
          unitRole="smart_campus"
          reviewerId={staff.id}
          reviewerName={staff.fullName}
          settings={settings}
          onDataChange={triggerRefresh}
          restrictStudentPrivacy={true}
        />
      )}

      {/* تب ۴: پیام‌های هوشمندسازی */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-sm text-slate-900 dark:text-white">
              پیام‌های واحد هوشمندسازی ({smartMessages.length.toLocaleString('fa-IR')})
            </h2>
            {onOpenMessages && (
              <button
                type="button"
                onClick={onOpenMessages}
                className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>باز کردن پنجره کامل پیام‌رسان</span>
              </button>
            )}
          </div>

          {smartMessages.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-xs text-slate-500">
              هنوز پیامی برای واحد هوشمندسازی ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {smartMessages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">{m.subject}</h4>
                      <p className="text-[11px] text-slate-500">
                        فرستنده: {m.senderName} • گیرنده: {m.receiverName || 'واحد هوشمندسازی'} • {m.date}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        m.status === 'answered'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}
                    >
                      {m.status === 'answered' ? 'پاسخ داده شده' : 'در انتظار پاسخ'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line">{m.content}</p>
                  {m.replies.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {m.replies.map((r) => (
                        <div key={r.id} className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs">
                          <span className="font-bold text-cyan-700 dark:text-cyan-300">{r.senderName}: </span>
                          <span>{r.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={replyByMsgId[m.id] || ''}
                      onChange={(e) => setReplyByMsgId((p) => ({ ...p, [m.id]: e.target.value }))}
                      placeholder="پاسخ سریع واحد هوشمندسازی..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuickReply(m.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold cursor-pointer"
                    >
                      ارسال پاسخ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* مودال ارسال پیام یا ثبت اخطار */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {actionModal.kind === 'warning' ? 'ثبت اخطار واحد هوشمندسازی' : 'ارسال پیام واحد هوشمندسازی'} —{' '}
                {actionModal.mode === 'single'
                  ? actionModal.targetStudent?.fullName
                  : `${filteredStudents.length.toLocaleString('fa-IR')} دانشجو`}
              </h3>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitAction} className="p-5 space-y-3 text-xs">
              {actionModal.kind === 'warning' && (
                <div>
                  <label className="block font-bold mb-1">درجه اهمیت اخطار</label>
                  <select
                    value={warningSeverity}
                    onChange={(e) => setWarningSeverity(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="low">عادی / تذکر اولیه</option>
                    <option value="medium">مهم</option>
                    <option value="high">فوری / بحرانی</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold mb-1">
                  {actionModal.kind === 'warning' ? 'عنوان اخطار *' : 'موضوع پیام *'}
                </label>
                <input
                  required
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder={
                    actionModal.kind === 'warning'
                      ? 'مثلاً عدم ثبت/فعال‌سازی کارت هوشمند تردد یا سامانه'
                      : 'مثلاً اطلاعیه سامانه هوشمند دانشگاه'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">شرح کامل *</label>
                <textarea
                  required
                  rows={4}
                  value={actionBody}
                  onChange={(e) => setActionBody(e.target.value)}
                  placeholder="متن پیام یا اخطار را با جزئیات لازم وارد کنید..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                    actionModal.kind === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-cyan-700 hover:bg-cyan-800'
                  }`}
                >
                  {actionModal.kind === 'warning' ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>ثبت و ارسال اخطار</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>ارسال پیام</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
