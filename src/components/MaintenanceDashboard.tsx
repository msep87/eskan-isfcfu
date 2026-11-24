import React, { useState, useEffect } from 'react';
import {
  MaintenanceStaff,
  MaintenanceTask,
  Dormitory,
  Room,
  Student,
} from '../types';
import { Storage } from '../utils/storage';
import {
  DEFAULT_WAREHOUSE_CATALOG,
  WAREHOUSE_CATALOG_CATEGORY_LABELS,
} from '../utils/warehouseCatalog';
import { SendSecurityReportModal } from './SendSecurityReportModal';
import { GraduationClearanceReviewPanel } from './GraduationClearanceReviewPanel';
import { CollapsibleMenuGrid } from './CollapsibleMenuGrid';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  Phone,
  Building2,
  MapPin,
  Calendar,
  User,
  Plus,
  Send,
  Check,
  X,
  FileText,
  DollarSign,
  Shield,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Sparkles,
  HelpCircle,
  CheckCheck,
  Package,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

interface MaintenanceDashboardProps {
  technician: MaintenanceStaff;
  dorms: Dormitory[];
  rooms: Room[];
  students?: Student[];
  tasks: MaintenanceTask[];
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenUserGuide?: (role: 'maintenance') => void;
}

export const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({
  technician,
  dorms,
  rooms,
  students,
  tasks,
  onRefreshData,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'clearance' | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterDorm, setFilterDorm] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // مدال تکمیل و رفع عیب
  const [completingTask, setCompletingTask] = useState<MaintenanceTask | null>(null);
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [costInput, setCostInput] = useState('');

  // مدال ثبت گزارش کار / تغییر وضعیت میانی
  const [updatingTask, setUpdatingTask] = useState<MaintenanceTask | null>(null);
  const [updateStatusVal, setUpdateStatusVal] = useState<MaintenanceTask['status']>('in_progress');
  const [updateNotesVal, setUpdateNotesVal] = useState('');

  // مدال ثبت خرابی جدید توسط تکنسین در محل
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDormId, setNewDormId] = useState(dorms[0]?.id || '');

  useEffect(() => {
    if (dorms.length > 0 && (!newDormId || !dorms.some((d) => d.id === newDormId))) {
      setNewDormId(dorms[0].id);
    }
  }, [dorms, newDormId]);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newLocationDetails, setNewLocationDetails] = useState('');
  const [newPriority, setNewPriority] = useState<MaintenanceTask['priority']>('normal');

  // مدال درخواست قطعه از انبار و کارپردازی
  const [partRequestTask, setPartRequestTask] = useState<MaintenanceTask | null>(null);
  const [partItemTitle, setPartItemTitle] = useState('');
  const [partItemId, setPartItemId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partUnit, setPartUnit] = useState('عدد');
  const [partReason, setPartReason] = useState('');
  const [partUrgency, setPartUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSendSecurityModalOpen, setIsSendSecurityModalOpen] = useState(false);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const allStudents = students || Storage.getStudents();

  const handleWarehouseRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partRequestTask || !partItemTitle.trim()) return;

    const isPresetSelected = Boolean(partItemId);
    const res = Storage.createWarehouseRequest({
      taskId: partRequestTask.id,
      taskTrackingCode: partRequestTask.trackingCode,
      dormId: partRequestTask.dormId,
      dormName: partRequestTask.dormName,
      requesterDepartment: technician.specialty || 'واحد تأسیسات و فنی',
      requestLocation: `${partRequestTask.dormName}${partRequestTask.roomNumber ? ` — اتاق ${partRequestTask.roomNumber}` : ''}`,
      requestedByStaffId: technician.id,
      requestedByStaffName: `${technician.fullName} (تأسیسات)`,
      requestedByRole: 'maintenance',
      itemTitle: partItemTitle.trim(),
      isCustomItem: !isPresetSelected,
      quantityRequested: Number(partQty) || 1,
      unit: partUnit.trim() || 'عدد',
      reason: partReason.trim() || `جهت رفع نقص ${partRequestTask.title}`,
      urgency: partUrgency,
    });

    if (res.success) {
      showFeedback(res.message);
      setPartRequestTask(null);
      onRefreshData();
    } else {
      showFeedback(res.message || 'خطا در ثبت درخواست قطعه', 'error');
    }
  };

  // فیلتر کارهای مرتبط با این تکنسین
  // یا اگر تسک برای همه تکنسین‌ها باشد و به سراهای تحت پوشش تکنسین بخورد
  const coveredDorms = technician.assignedDormIds || ['all'];
  const isAllDorms = coveredDorms.includes('all');

  const myTasks = tasks.filter((t) => {
    // اگر صراحتاً به این تکنسین واگذار شده باشد
    if (t.assignedToStaffId === technician.id) return true;
    // یا اگر به کسی واگذار نشده باشد ولی در سراهای تحت پوشش این تکنسین باشد
    if (!t.assignedToStaffId && (isAllDorms || coveredDorms.includes(t.dormId))) return true;
    // همچنین تکنسین می‌تواند کل کارهای سراهای تحت پوشش را ببیند
    if (isAllDorms || coveredDorms.includes(t.dormId)) return true;
    return false;
  });

  // آمار
  const totalMyTasks = myTasks.length;
  const inProgressCount = myTasks.filter((t) => t.status === 'in_progress').length;
  const pendingCount = myTasks.filter((t) => t.status === 'pending' || t.status === 'assigned').length;
  const waitingPartsCount = myTasks.filter((t) => t.status === 'waiting_parts').length;
  const resolvedCount = myTasks.filter((t) => t.status === 'resolved').length;
  const emergencyCount = myTasks.filter((t) => (t.priority === 'emergency' || t.priority === 'urgent') && t.status !== 'resolved').length;

  // فیلتر نهایی
  const filteredTasks = myTasks.filter((t) => {
    if (filterStatus === 'mine' && t.assignedToStaffId !== technician.id) return false;
    if (filterStatus !== 'all' && filterStatus !== 'mine' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterDorm !== 'all' && t.dormId !== filterDorm) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCode = t.trackingCode.toLowerCase().includes(q);
      const matchRoom = (t.roomNumber || '').toLowerCase().includes(q);
      const matchDorm = t.dormName.toLowerCase().includes(q);
      const matchStudent = (t.sourceStudentName || '').toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCode || matchRoom || matchDorm || matchStudent;
    }

    return true;
  });

  // پذیرفتن مأموریت و شروع به کار
  const handleStartWork = (task: MaintenanceTask) => {
    const res = Storage.updateMaintenanceTask(task.id, {
      status: 'in_progress',
      assignedToStaffId: technician.id,
      assignedToStaffName: technician.fullName,
      assignedAt: new Date().toLocaleDateString('fa-IR'),
      technicianNotes: task.technicianNotes || 'شروع بازرسی و فرایند تعمیر توسط تکنسین',
    });
    if (res.success) {
      showFeedback(`مأموریت «${task.trackingCode}» در وضعیت در دست اقدام قرار گرفت.`);
      onRefreshData();
    }
  };

  // ارسال فرم تکمیل و رفع عیب
  const handleCompleteTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    if (!technicianNotes.trim()) {
      showFeedback('لطفاً شرح عملیات انجام‌شده را بنویسید.', 'error');
      return;
    }

    const costNum = costInput ? parseInt(costInput.replace(/,/g, ''), 10) : undefined;

    const res = Storage.updateMaintenanceTask(completingTask.id, {
      status: 'resolved',
      assignedToStaffId: technician.id,
      assignedToStaffName: technician.fullName,
      resolvedAt:
        new Date().toLocaleDateString('fa-IR') +
        ' - ' +
        new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      technicianNotes: technicianNotes.trim(),
      partsUsed: partsUsed.trim() || undefined,
      cost: costNum,
    });

    if (res.success) {
      showFeedback(`مأموریت «${completingTask.trackingCode}» با موفقیت رفع عیب و خاتمه یافت.`);
      setCompletingTask(null);
      setTechnicianNotes('');
      setPartsUsed('');
      setCostInput('');
      onRefreshData();
    }
  };

  // ثبت وضعیت میانی / یادداشت تکنسین
  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingTask) return;

    const res = Storage.updateMaintenanceTask(updatingTask.id, {
      status: updateStatusVal,
      assignedToStaffId: technician.id,
      assignedToStaffName: technician.fullName,
      technicianNotes: updateNotesVal.trim() || updatingTask.technicianNotes,
    });

    if (res.success) {
      showFeedback('وضعیت مأموریت با موفقیت بروزرسانی شد.');
      setUpdatingTask(null);
      setUpdateNotesVal('');
      onRefreshData();
    }
  };

  // ثبت خرابی جدید توسط خود تکنسین
  const handleCreateNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newDormId) {
      showFeedback('لطفاً عنوان، سرا و شرح خرابی را تکمیل فرمایید.', 'error');
      return;
    }

    const selectedDorm = dorms.find((d) => d.id === newDormId);
    const res = Storage.addMaintenanceTask({
      title: newTitle.trim(),
      description: newDescription.trim(),
      dormId: newDormId,
      dormName: selectedDorm?.name || 'سرای دانشجویی',
      roomNumber: newRoomNumber.trim() || undefined,
      locationDetails: newLocationDetails.trim() || undefined,
      priority: newPriority,
      source: 'supervisor_observed', // از طرف پرسنل
      createdById: technician.id,
      createdByName: `${technician.fullName} (کارشناس تأسیسات)`,
      createdByRole: 'supervisor',
      assignedToStaffId: technician.id,
      assignedToStaffName: technician.fullName,
      assignedAt: new Date().toLocaleDateString('fa-IR'),
      status: 'in_progress',
    });

    if (res.success) {
      showFeedback(res.message);
      setIsNewTaskModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewRoomNumber('');
      setNewLocationDetails('');
      setNewPriority('normal');
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">

      {/* بنر پیام عملیات */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* کارت سربرگ کارتابل تکنسین */}
      <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Wrench className="w-8 h-8 text-amber-200" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">{technician.fullName}</h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold shadow-xs">
                  {technician.specialty || 'تکنسین تأسیسات'}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 font-bold border border-emerald-400/40">
                  وضعیت: فعال و در دسترس
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-1.5 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-300" />
                  <span dir="ltr">{technician.phone}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    سراهای تحت پوشش:{' '}
                    {isAllDorms
                      ? 'تمامی سراها و پردیس‌ها'
                      : dorms
                          .filter((d) => coveredDorms.includes(d.id))
                          .map((d) => d.name)
                          .join('، ') || 'سراهای دانشگاه'}
                  </span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-amber-50 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>+ ثبت خرابی جدید در محل</span>
            </button>

            <button
              onClick={onOpenMessages}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-white/20 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-amber-200" />
              <span>صندوق پیام‌ها و تیکت‌ها</span>
            </button>

            <button
              onClick={() => setIsSendSecurityModalOpen(true)}
              className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 text-amber-300 border border-amber-400/40 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              title="ارسال گزارش مستقیم برای یک یا چند دانشجو به واحد حراست و انتظامات"
            >
              <Shield className="w-4 h-4" />
              <span>گزارش به حراست</span>
            </button>

            {onOpenUserGuide && (
              <button
                onClick={() => onOpenUserGuide('maintenance')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
                title="مشاهده دفترچه راهنمای جامع کارشناس تأسیسات و دانلود PDF"
              >
                <BookOpen className="w-4 h-4 text-indigo-200" />
                <span>راهنمای تأسیسات (PDF)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* منوی بازشونده کارتابل تأسیسات و فنی */}
      <CollapsibleMenuGrid<'tasks' | 'clearance'>
        activeKey={activeTab}
        onToggle={(key) => setActiveTab((prev) => (prev === key ? null : key))}
        onCloseActive={() => setActiveTab(null)}
        title="منوی بخش‌های واحد تأسیسات و فنی (برای باز یا بسته شدن کلیک کنید)"
        emptyPrompt="برای مشاهده هر بخش، روی دکمه مربوطه کلیک کنید. با کلیک مجدد همان بخش بسته می‌شود."
        items={[
          {
            id: 'tasks',
            label: 'مأموریت‌های فنی و تعمیرات',
            subtitle: 'گزارش‌های خرابی، درخواست قطعه و اتمام کار',
            icon: <Wrench className="w-4 h-4" />,
            badge: myTasks.length,
            badgeTone: 'amber',
            activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md',
          },
          {
            id: 'clearance',
            label: 'تسویه حساب فارغ‌التحصیلان',
            subtitle: 'بررسی عدم خسارت تأسیساتی و تأیید تسویه',
            icon: <GraduationCap className="w-4 h-4" />,
            badge: Storage.getGraduationClearances().filter(
              (c) =>
                c.educationGateStatus === 'approved' &&
                (c.units?.maintenance?.status || 'pending') === 'pending'
            ).length,
            badgeTone: 'rose',
            activeClass: 'bg-sky-700 text-white border-sky-700 shadow-md',
          },
        ]}
      />

      {activeTab === 'clearance' && (
        <GraduationClearanceReviewPanel
          unitRole="maintenance"
          reviewerId={technician.id}
          reviewerName={technician.fullName}
          settings={Storage.getSettings()}
          onDataChange={onRefreshData}
        />
      )}

      {activeTab === 'tasks' && (
        <>
      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">کل مأموریت‌ها</div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalMyTasks}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">در کارتابل سراها</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs">
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>در حال انجام</span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1">{inProgressCount}</div>
          <div className="text-[10px] text-amber-600/80">تعمیرات در دست اقدام</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs">
          <div className="text-[11px] text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>در انتظار ارجاع/اقدام</span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-300 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-blue-600/80">کار جدید یا محول شده</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 shadow-xs">
          <div className="text-[11px] text-purple-700 dark:text-purple-400 font-bold flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>انتظار تأمین قطعه</span>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-300 mt-1">{waitingPartsCount}</div>
          <div className="text-[10px] text-purple-600/80">نیاز به خرید یا تدارکات</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs">
          <div className="text-[11px] text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>فوری و اضطراری</span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-300 mt-1">{emergencyCount}</div>
          <div className="text-[10px] text-rose-600/80">اولویت اقدام سریع</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs">
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>رفع عیب و تکمیل شده</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-1">{resolvedCount}</div>
          <div className="text-[10px] text-emerald-600/80">پایان‌یافته با موفقیت</div>
        </div>
      </div>

      {/* ابزارهای فیلتر و جستجو */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* تب وضعیت‌ها */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              همه ({myTasks.length})
            </button>
            <button
              onClick={() => setFilterStatus('mine')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === 'mine'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              کارهای ارجاع‌شده به من ({myTasks.filter((t) => t.assignedToStaffId === technician.id).length})
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === 'in_progress'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              در حال اقدام ({inProgressCount})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              در انتظار ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('waiting_parts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === 'waiting_parts'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              نیاز به قطعه ({waitingPartsCount})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              رفع عیب شده ({resolvedCount})
            </button>
          </div>

          {/* فیلتر سرا و جستجو */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDorm}
              onChange={(e) => setFilterDorm(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">تمامی سراها</option>
              {dorms.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">تمامی اولویت‌ها</option>
              <option value="emergency">🚨 اضطراری</option>
              <option value="urgent">⚡ فوری</option>
              <option value="normal">عادی</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی کد، اتاق، عنوان..."
                className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-48 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* لیست کارت‌های سفارش کار و تعمیرات */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
          <CheckCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-75" />
          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
            هیچ سفارش کار یا خرابی تأسیساتی با فیلتر انتخابی یافت نشد.
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            همه موارد پیگیری شده یا شرایط فیلتر را تغییر دهید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const isAssignedToMe = task.assignedToStaffId === technician.id;
            const isEmergency = task.priority === 'emergency';
            const isUrgent = task.priority === 'urgent';
            const isResolved = task.status === 'resolved';

            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between relative overflow-hidden ${
                  isResolved
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10'
                    : isEmergency
                    ? 'border-rose-400 dark:border-rose-800 ring-2 ring-rose-400/20'
                    : isUrgent
                    ? 'border-amber-400 dark:border-amber-800'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-400'
                }`}
              >
                <div>
                  {/* سربرگ کارت: کد رهگیری و نشانگر اولویت و وضعیت */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {task.trackingCode}
                      </span>

                      {/* برچسب اولویت */}
                      {isEmergency && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold flex items-center gap-1 shadow-xs animate-pulse">
                          <Flame className="w-3 h-3" />
                          <span>اضطراری</span>
                        </span>
                      )}
                      {isUrgent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold flex items-center gap-1 shadow-xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>فوری</span>
                        </span>
                      )}
                      {task.priority === 'normal' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                          اولویت عادی
                        </span>
                      )}
                    </div>

                    {/* وضعیت */}
                    <div>
                      {task.status === 'resolved' ? (
                        <span className="text-[11px] px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>رفع نقص شد</span>
                        </span>
                      ) : task.status === 'in_progress' ? (
                        <span className="text-[11px] px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          <span>در حال تعمیر</span>
                        </span>
                      ) : task.status === 'waiting_parts' ? (
                        <span className="text-[11px] px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-extrabold border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-purple-600" />
                          <span>نیاز به قطعه</span>
                        </span>
                      ) : (
                        <span className="text-[11px] px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-800">
                          در انتظار اقدام
                        </span>
                      )}
                    </div>
                  </div>

                  {/* عنوان و مکان دقیق */}
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-2 leading-snug">
                    {task.title}
                  </h3>

                  {/* موقعیت مکانی */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{task.dormName}</span>
                    </div>
                    {task.roomNumber && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1 font-extrabold text-teal-700 dark:text-teal-300">
                          <span>اتاق {task.roomNumber}</span>
                        </div>
                      </>
                    )}
                    {task.locationDetails && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>{task.locationDetails}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* شرح خرابی */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                    {task.description}
                  </p>

                  {/* منبع گزارش: دانشجو یا سرپرست */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 mb-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>
                          گزارش‌دهنده:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {task.source === 'student_report'
                              ? `${task.sourceStudentName || 'دانشجومعلم'} (دانشجو)`
                              : `${task.createdByName} (${task.createdByRole === 'admin' ? 'مدیر' : 'سرپرست سرا'})`}
                          </strong>
                        </span>
                      </div>
                      <span>ثبت: {task.createdAt}</span>
                    </div>

                    {task.sourceStudentPhone && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Phone className="w-3 h-3 text-blue-500" />
                        <span>تلفن تماس دانشجو: </span>
                        <span dir="ltr" className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                          {task.sourceStudentPhone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* توضیحات تکنسین و گزارش کار قبلی */}
                  {task.technicianNotes && (
                    <div className="mb-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs">
                      <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between mb-1">
                        <span>گزارش کار و توضیحات تکنسین:</span>
                        {task.assignedToStaffName && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400">
                            ثبت شده توسط: {task.assignedToStaffName}
                          </span>
                        )}
                      </div>
                      <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                        {task.technicianNotes}
                      </p>
                      {task.partsUsed && (
                        <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
                          <strong>قطعات مصرفی: </strong>
                          <span>{task.partsUsed}</span>
                        </div>
                      )}
                      {task.cost ? (
                        <div className="mt-1 text-[11px] text-amber-900 dark:text-amber-200">
                          <strong>هزینه فاکتور/قطعات: </strong>
                          <span>{Number(task.cost).toLocaleString('fa-IR')} ریال</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* تأییدیه سرپرست */}
                  {task.supervisorVerified && (
                    <div className="mb-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>تأییدیه حسن انجام کار توسط سرپرست سرا ثبت گردید.</span>
                    </div>
                  )}
                </div>

                {/* دکمه‌های عملیاتی برای تکنسین */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    {task.assignedToStaffName ? (
                      <span>ارجاع به: <strong className="text-slate-700 dark:text-slate-300">{task.assignedToStaffName}</strong></span>
                    ) : (
                      <span className="text-amber-600 font-bold">در انتظار واگذاری</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* اگر در انتظار است یا به این تکنسین واگذار شده */}
                    {task.status !== 'resolved' && (
                      <>
                        {task.status !== 'in_progress' && (
                          <button
                            onClick={() => handleStartWork(task)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>شروع به کار</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setUpdatingTask(task);
                            setUpdateStatusVal(task.status);
                            setUpdateNotesVal(task.technicianNotes || '');
                          }}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>ثبت وضعیت / یادداشت</span>
                        </button>

                        <button
                          onClick={() => {
                            setPartRequestTask(task);
                            setPartItemTitle('');
                            setPartItemId('');
                            setPartQty(1);
                            setPartUnit('عدد');
                            setPartReason(`جهت رفع نقص و تعمیر ${task.title} (${task.dormName})`);
                            setPartUrgency(task.priority === 'emergency' ? 'emergency' : task.priority === 'urgent' ? 'urgent' : 'normal');
                          }}
                          className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 dark:hover:bg-violet-900 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-violet-200 dark:border-violet-800"
                          title="ارسال درخواست قطعه مصرفی به انبار و کارپردازی"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>درخواست قطعه از انبار</span>
                        </button>

                        <button
                          onClick={() => {
                            setCompletingTask(task);
                            setTechnicianNotes(task.technicianNotes || '');
                            setPartsUsed(task.partsUsed || '');
                            setCostInput(task.cost ? String(task.cost) : '');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>اعلام رفع عیب و اتمام</span>
                        </button>
                      </>
                    )}

                    {task.status === 'resolved' && (
                      <button
                        onClick={() => {
                          setCompletingTask(task);
                          setTechnicianNotes(task.technicianNotes || '');
                          setPartsUsed(task.partsUsed || '');
                          setCostInput(task.cost ? String(task.cost) : '');
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>ویرایش گزارش کار</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* مدال اعلام رفع عیب و پایان کار */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    اعلام رفع عیب و اتمام مأموریت تأسیساتی
                  </h3>
                  <p className="text-xs text-slate-400">
                    کد رهگیری: {completingTask.trackingCode} • {completingTask.dormName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompletingTask(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteTaskSubmit} className="space-y-4 my-4">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold block text-slate-800 dark:text-slate-100 mb-1">
                  موضوع: {completingTask.title}
                </span>
                <span>{completingTask.description}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شرح کامل اقدامات انجام‌شده و رفع عیب <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="مثلاً: شیر آب با نوار تفلون آب‌بندی شد، مغزی تعویض گردید و تست فشار بدون نشتی انجام شد..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  قطعات یا لوازم مصرفی (اختیاری):
                </label>
                <input
                  type="text"
                  value={partsUsed}
                  onChange={(e) => setPartsUsed(e.target.value)}
                  placeholder="مثلاً: یک عدد واشر سیلیکونی، ۲ متر لوله ۵ لایه..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  هزینه فاکتور یا قطعات به ریال (اختیاری):
                </label>
                <input
                  type="text"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  placeholder="مثلاً: 450000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none dir-ltr text-left"
                  dir="ltr"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأیید و ثبت پایان عملیات تعمیر</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال بروزرسانی وضعیت میانی یا نیاز به قطعه */}
      {updatingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                بروزرسانی وضعیت سفارش کار ({updatingTask.trackingCode})
              </h3>
              <button
                onClick={() => setUpdatingTask(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تغییر وضعیت مأموریت:
                </label>
                <select
                  value={updateStatusVal}
                  onChange={(e) => setUpdateStatusVal(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="in_progress">در حال انجام و تعمیر</option>
                  <option value="waiting_parts">در انتظار تأمین قطعه / خرید تدارکات</option>
                  <option value="assigned">ارجاع شده و در نوبت مراجعه</option>
                  <option value="pending">در انتظار هماهنگی با ساکنین اتاق</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  یادداشت پیشرفت کار / لیست قطعات مورد نیاز:
                </label>
                <textarea
                  rows={3}
                  value={updateNotesVal}
                  onChange={(e) => setUpdateNotesVal(e.target.value)}
                  placeholder="توضیحات پیشرفت کار یا نیاز به قطعه جهت اطلاع سرپرست سرا..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdatingTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال درخواست قطعه از انبار و کارپردازی */}
      {partRequestTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-600">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    درخواست قطعه و لوازم از انبار و کارپردازی
                  </h3>
                  <p className="text-xs text-slate-400">
                    مأموریت: {partRequestTask.trackingCode} • {partRequestTask.dormName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPartRequestTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWarehouseRequestSubmit} className="space-y-3.5 mt-4">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                  عنوان کار: {partRequestTask.title}
                </div>
                <div className="text-slate-500">
                  سرا: {partRequestTask.dormName} {partRequestTask.roomNumber ? `(اتاق ${partRequestTask.roomNumber})` : ''}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    انتخاب از فهرست پیش‌فرض اقلام انبار (یا افزودن قلم جدید)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    موجودی واقعی انبار منحصراً در اختیار مسئول انبار است
                  </span>
                </div>
                <select
                  value={partItemId}
                  onChange={(e) => {
                    setPartItemId(e.target.value);
                    const it = DEFAULT_WAREHOUSE_CATALOG.find((i) => i.id === e.target.value);
                    if (it) {
                      setPartItemTitle(it.name);
                      setPartUnit(it.defaultUnit);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium mb-1.5"
                >
                  <option value="">-- انتخاب از فهرست پیش‌فرض اقلام --</option>
                  {DEFAULT_WAREHOUSE_CATALOG.map((it) => (
                    <option key={it.id} value={it.id}>
                      [{WAREHOUSE_CATALOG_CATEGORY_LABELS[it.category]}] {it.name} ({it.defaultUnit})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="یا عنوان قلم/قطعه جدید (خارج از لیست) را دستی بنویسید..."
                  value={partItemTitle}
                  onChange={(e) => {
                    setPartItemTitle(e.target.value);
                    setPartItemId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مقدار نیاز *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={partQty}
                    onChange={(e) => setPartQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    واحد
                  </label>
                  <input
                    type="text"
                    value={partUnit}
                    onChange={(e) => setPartUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    اولویت نیاز
                  </label>
                  <select
                    value={partUrgency}
                    onChange={(e) => setPartUrgency(e.target.value as any)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری</option>
                    <option value="emergency">اضطراری</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شرح نیاز و علت تعویض
                </label>
                <textarea
                  rows={2}
                  placeholder="مثلاً: مغزی قبلی شکسته است و نیاز به تعویض فوری دارد..."
                  value={partReason}
                  onChange={(e) => setPartReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>ارسال درخواست به کارتابل انبار و تأیید سرپرست</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPartRequestTask(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  ثبت مستقیم گزارش خرابی توسط تکنسین
                </h3>
              </div>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTask} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سرای مربوطه:
                </label>
                <select
                  value={newDormId}
                  onChange={(e) => setNewDormId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {dorms.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره اتاق (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="مثلاً ۱۰۴"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اولویت اقدام:
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">⚡ فوری</option>
                    <option value="emergency">🚨 اضطراری</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  محل دقیق خرابی در سرا:
                </label>
                <input
                  type="text"
                  value={newLocationDetails}
                  onChange={(e) => setNewLocationDetails(e.target.value)}
                  placeholder="مثلاً: راهرو طبقه اول، آشپزخانه شرقی، موتورخانه..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان خلاصه خرابی:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثلاً: سوختن پمپ سیرکولاتور پکیج..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شرح کامل نقص و اقدامات اولیه:
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="توضیحات مشاهدات فنی خود را بنویسید..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition cursor-pointer"
                >
                  ثبت مأموریت در کارتابل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SendSecurityReportModal
        isOpen={isSendSecurityModalOpen}
        onClose={() => setIsSendSecurityModalOpen(false)}
        reporterRole="maintenance"
        reporterId={technician.id}
        reporterName={technician.fullName}
        students={allStudents}
        dorms={dorms}
        rooms={rooms}
        defaultDormId={coveredDorms.includes('all') ? dorms[0]?.id : coveredDorms[0]}
        onSuccess={(msg) => {
          showFeedback(msg);
          onRefreshData();
        }}
      />

    </div>
  );
};
