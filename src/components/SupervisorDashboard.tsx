import React, { useState } from 'react';
import {
  Supervisor,
  Dormitory,
  Room,
  Bed,
  Student,
  Announcement,
  RoomWarning,
  AppSettings,
  MaintenanceTask,
  MaintenanceStaff,
  SupervisorShiftSchedule,
  ShiftLogReport,
  StudentEvaluation,
} from '../types';
import { Storage } from '../utils/storage';
import { exportShiftReportsToExcel } from '../utils/excelUtils';
import { SupervisorRoomManager } from './SupervisorRoomManager';
import { VisualBedPicker } from './VisualBedPicker';
import { RoomWarningModal } from './RoomWarningModal';
import { DormIdCardModal } from './DormIdCardModal';
import { StudentEvaluationModal } from './StudentEvaluationModal';
import {
  Building2,
  Users,
  Bed as BedIcon,
  ShieldAlert,
  Bell,
  Sparkles,
  BarChart3,
  MessageSquare,
  Plus,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  X,
  FileSpreadsheet,
  Clock,
  XCircle,
  CheckCheck,
  Upload,
  Trash2,
  Image as ImageIcon,
  QrCode,
  Edit3,
  UserMinus,
  UserPlus,
  Save,
  Wrench,
  Search,
  CheckCircle2,
  Phone,
  Tag,
  AlertCircle,
  Package,
  Boxes,
  BookOpen,
  Printer,
  Award,
} from 'lucide-react';

interface SupervisorDashboardProps {
  supervisor: Supervisor;
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  announcements: Announcement[];
  warnings: RoomWarning[];
  settings: AppSettings;
  maintenanceTasks?: MaintenanceTask[];
  maintenanceStaff?: MaintenanceStaff[];
  onRefreshData: () => void;
  onOpenReports: () => void;
  onOpenMessages: () => void;
  onOpenExcelModal: () => void;
  onOpenUserGuide?: (role: 'supervisor') => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  supervisor,
  dorms,
  rooms,
  beds,
  students,
  announcements,
  warnings,
  settings,
  maintenanceTasks,
  maintenanceStaff,
  onRefreshData,
  onOpenReports,
  onOpenMessages,
  onOpenExcelModal,
  onOpenUserGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'manager' | 'visual_picker' | 'announcements' | 'students' | 'maintenance' | 'warehouse' | 'shifts'>('manager');
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isStudentEvalModalOpen, setIsStudentEvalModalOpen] = useState(false);
  const [evalTargetStudent, setEvalTargetStudent] = useState<Student | null>(null);
  const [evalRefreshTick, setEvalRefreshTick] = useState(0);

  // فرم ثبت گزارش شیفت و دفتر وقایع روزانه
  const [isAddShiftReportModalOpen, setIsAddShiftReportModalOpen] = useState(false);
  const [repShiftDate, setRepShiftDate] = useState('۱۴۰۵/۰۷/۱۵');
  const [repShiftDormId, setRepShiftDormId] = useState('');
  const [repShiftType, setRepShiftType] = useState<ShiftLogReport['shiftType']>('evening');
  const [repShiftTime, setRepShiftTime] = useState('۱۵:۰۰ الی ۲۳:۰۰');
  const [repStudentCount, setRepStudentCount] = useState<number>(85);
  const [repInspections, setRepInspections] = useState('');
  const [repIncidents, setRepIncidents] = useState('');
  const [repHandover, setRepHandover] = useState('');

  // فیلترهای گزارش‌گیری از شیفت‌ها
  const [repFilterDorm, setRepFilterDorm] = useState('all');
  const [repFilterSupervisor, setRepFilterSupervisor] = useState('all');
  const [repFilterType, setRepFilterType] = useState('all');
  const [repSearchQuery, setRepSearchQuery] = useState('');

  // فرم اطلاعیه جدید یا ویرایش
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnPriority, setNewAnnPriority] = useState<Announcement['priority']>('normal');
  const [newAnnImage, setNewAnnImage] = useState<string | null>(null);
  const [viewCardStudent, setViewCardStudent] = useState<Student | null>(null);

  // فرم ثبت مستقیم خرابی تأسیسات توسط سرپرست
  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false);
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintDormId, setMaintDormId] = useState('');
  const [maintRoomNumber, setMaintRoomNumber] = useState('');
  const [maintPriority, setMaintPriority] = useState<MaintenanceTask['priority']>('normal');
  const [maintCategory, setMaintCategory] = useState<MaintenanceTask['category']>('plumbing');
  const [maintStaffId, setMaintStaffId] = useState('');
  const [maintSearchQuery, setMaintSearchQuery] = useState('');
  const [maintStatusFilter, setMaintStatusFilter] = useState<string>('all');
  const [maintFeedback, setMaintFeedback] = useState<string | null>(null);

  // تخصیص تخت به دانشجوی فاقد اسکان از جدول
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
  const [targetBedForStudent, setTargetBedForStudent] = useState('');

  const handleStartEditAnnouncement = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setNewAnnTitle(ann.title);
    setNewAnnContent(ann.content);
    setNewAnnPriority(ann.priority);
    setNewAnnImage(ann.imageUrl || null);
    setShowAddAnnouncement(true);
  };

  const handleCancelEditAnnouncement = () => {
    setEditingAnnId(null);
    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnPriority('normal');
    setNewAnnImage(null);
    setShowAddAnnouncement(false);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('آیا از حذف این اطلاعیه اطمینان دارید؟')) {
      Storage.deleteAnnouncement(id);
      setActionFeedback('اطلاعیه با موفقیت حذف گردید.');
      onRefreshData();
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // حذف دانشجو از اتاق / آزادسازی تخت
  const handleEvictStudent = (st: Student) => {
    if (
      confirm(
        `آیا از لغو اسکان و حذف دانشجو «${st.fullName}» از اتاق اطمینان دارید؟\nپرونده دانشجو در سیستم حفظ شده و وضعیت وی به «فاقد اسکان» تغییر می‌یابد و تخت آزاد می‌گردد.`
      )
    ) {
      const res = Storage.releaseBed(st.studentId);
      setActionFeedback(res.message);
      onRefreshData();
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // تخصیص دانشجو از جدول به تخت
  const handleAssignStudentFromTable = () => {
    if (!assigningStudent || !targetBedForStudent) return;
    const res = Storage.assignBedToStudent(assigningStudent.studentId, targetBedForStudent, true);
    setActionFeedback(res.message);
    setAssigningStudent(null);
    setTargetBedForStudent('');
    onRefreshData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleAnnImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم عکس اطلاعیه نباید بیشتر از ۵ مگابایت باشد.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewAnnImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // سراهای تحت نظارت این سرپرست
  const myAssignedDormIds: string[] =
    supervisor.assignedDormIds && supervisor.assignedDormIds.length > 0
      ? supervisor.assignedDormIds
      : supervisor.assignedDormId && supervisor.assignedDormId !== 'all'
      ? [supervisor.assignedDormId]
      : dorms.map((d) => d.id);

  const myDorms = dorms.filter((d) => myAssignedDormIds.includes(d.id));

  // انتخاب سرای فعال برای فیلتر یا مشاهده همه سراهای تحت نظارت
  const [selectedDormId, setSelectedDormId] = useState<string>(
    myDorms.length === 1 ? myDorms[0].id : 'all'
  );

  const activeDormIds = selectedDormId === 'all' ? myAssignedDormIds : [selectedDormId];
  const dormBeds = beds.filter((b) => activeDormIds.includes(b.dormId));
  const totalBeds = dormBeds.length;
  const occupiedBeds = dormBeds.filter((b) => b.studentId).length;
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const currentDorm = dorms.find((d) => d.id === selectedDormId) || myDorms[0] || dorms[0];

  // دانشجویان با تخصیص موقت در این خوابگاه
  const pendingStudentsInMyDorm = students.filter(
    (s) =>
      s.assignedBedId &&
      s.assignmentStatus === 'temporary' &&
      activeDormIds.includes(s.assignedDormId || '')
  );
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleBulkApprove = () => {
    if (pendingStudentsInMyDorm.length === 0) return;
    if (
      confirm(
        `آیا از تأیید دسته‌جمعی درخواست‌های اسکان موقت (${pendingStudentsInMyDorm.length} دانشجو) اطمینان دارید؟`
      )
    ) {
      const res = Storage.bulkConfirmAllAssignments(activeDormIds);
      setActionFeedback(res.message);
      onRefreshData();
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleConfirmSingle = (studentId: string) => {
    const res = Storage.confirmStudentAssignment(studentId);
    setActionFeedback(res.message);
    onRefreshData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleRejectSingle = (studentId: string) => {
    const reason = prompt(
      'لطفاً علت عدم تأیید اسکان را وارد فرمایید (برای دانشجو پیامک/نوتیفیکیشن ارسال می‌گردد):',
      'عدم تطابق با شرایط سرا یا تغییر برنامه اسکان'
    );
    if (reason !== null) {
      const res = Storage.rejectStudentAssignment(studentId, reason);
      setActionFeedback(res.message);
      onRefreshData();
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    if (editingAnnId) {
      Storage.updateAnnouncement(editingAnnId, {
        title: newAnnTitle.trim(),
        content: newAnnContent.trim(),
        priority: newAnnPriority,
        imageUrl: newAnnImage || undefined,
      });
      setActionFeedback('اطلاعیه با موفقیت ویرایش شد.');
      setEditingAnnId(null);
    } else {
      const currentAnn = Storage.getAnnouncements();
      currentAnn.unshift({
        id: `ann_${Date.now()}`,
        title: newAnnTitle.trim(),
        content: newAnnContent.trim(),
        author: `${supervisor.fullName} (سرپرست ${currentDorm?.name || 'سرا'})`,
        priority: newAnnPriority,
        date: new Date().toLocaleDateString('fa-IR'),
        targetDormId: selectedDormId === 'all' ? (myDorms[0]?.id || 'all') : selectedDormId,
        showOnHomePage: true,
        imageUrl: newAnnImage || undefined,
      });
      Storage.setAnnouncements(currentAnn);
      setActionFeedback('اطلاعیه جدید با موفقیت ثبت و منتشر گردید.');
    }

    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnImage(null);
    setShowAddAnnouncement(false);
    onRefreshData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleResolveWarning = (warningId: string) => {
    Storage.resolveWarning(warningId);
    onRefreshData();
  };

  // وظایف تأسیساتی سراهای این سرپرست
  const allTasks = maintenanceTasks || Storage.getMaintenanceTasks();
  const allStaff = (maintenanceStaff || Storage.getMaintenanceStaff()).filter(
    (s) => s.status === 'active' || s.isActive !== false
  );
  const myMaintenanceTasks = allTasks.filter(
    (t) => activeDormIds.includes(t.dormId) || (selectedDormId === 'all' && myAssignedDormIds.includes(t.dormId))
  );
  const activeMaintTasksCount = myMaintenanceTasks.filter(
    (t) => t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled'
  ).length;

  const handleCreateDirectMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintTitle.trim() || !maintDormId) return;

    const dormObj = dorms.find((d) => d.id === maintDormId);
    const dormName = dormObj ? dormObj.name : 'سرای دانشجویی';
    const staffObj = allStaff.find((s) => s.id === maintStaffId);

    const res = Storage.addMaintenanceTask({
      title: maintTitle.trim(),
      description: maintDesc.trim(),
      dormId: maintDormId,
      dormName,
      roomNumber: maintRoomNumber.trim() || undefined,
      locationDetails: maintRoomNumber.trim() ? `اتاق ${maintRoomNumber.trim()}` : undefined,
      priority: maintPriority,
      category: maintCategory,
      source: 'supervisor_direct',
      createdById: supervisor.id,
      createdByName: supervisor.fullName,
      createdByRole: 'supervisor',
      assignedToStaffId: staffObj?.id,
      assignedToStaffName: staffObj?.fullName,
      status: staffObj?.id ? 'assigned' : 'pending',
    });

    setMaintFeedback(`خرابی تأسیسات با کد رهگیری ${res.task.trackingCode} با موفقیت ثبت و ارجاع گردید.`);
    setMaintTitle('');
    setMaintDesc('');
    setMaintRoomNumber('');
    setIsAddMaintenanceModalOpen(false);
    onRefreshData();
    setTimeout(() => setMaintFeedback(null), 4000);
  };

  const handleVerifyResolvedTask = (taskId: string) => {
    Storage.updateMaintenanceTask(taskId, {
      supervisorVerified: true,
      supervisorVerifiedAt: new Date().toLocaleDateString('fa-IR'),
    });
    setMaintFeedback('رفع نقص تأسیساتی با موفقیت توسط سرپرست تأیید گردید.');
    onRefreshData();
    setTimeout(() => setMaintFeedback(null), 3000);
  };

  const handleSupervisorAssignTech = (taskId: string, staffId: string) => {
    const staffObj = allStaff.find((s) => s.id === staffId);
    if (!staffObj) return;
    Storage.updateMaintenanceTask(taskId, {
      assignedToStaffId: staffObj.id,
      assignedToStaffName: staffObj.fullName,
      status: 'assigned',
      assignedAt: new Date().toLocaleDateString('fa-IR'),
    });
    setMaintFeedback(`مأموریت با موفقیت به «${staffObj.fullName}» تخصیص داده شد.`);
    onRefreshData();
    setTimeout(() => setMaintFeedback(null), 3000);
  };

  const handleCreateShiftReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repInspections.trim() || !repHandover.trim()) {
      alert('لطفاً خلاصه بازرسی و نکات تحویل به شیفت بعد را وارد فرمایید.');
      return;
    }
    const targetDorm = dorms.find((d) => d.id === (repShiftDormId || currentDorm?.id));
    const dormName = targetDorm ? targetDorm.name : (currentDorm?.name || 'سراهای دانشجویی');

    Storage.addShiftReport({
      supervisorId: supervisor.id,
      supervisorName: supervisor.fullName,
      dormId: targetDorm?.id || currentDorm?.id || 'all',
      dormName,
      shiftDate: repShiftDate.trim() || new Date().toLocaleDateString('fa-IR'),
      shiftType: repShiftType,
      shiftTime: repShiftTime.trim() || undefined,
      inspectionsSummary: repInspections.trim(),
      incidentsSummary: repIncidents.trim() || undefined,
      handoverNotes: repHandover.trim(),
      presentStudentCount: Number(repStudentCount) || undefined,
    });

    setActionFeedback('گزارش شیفت و وقایع روزانه با موفقیت در دفتر وقایع ثبت شد و در دسترس همه سرپرستان قرار گرفت.');
    setIsAddShiftReportModalOpen(false);
    setRepInspections('');
    setRepIncidents('');
    setRepHandover('');
    onRefreshData();
    setTimeout(() => setActionFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">

      <RoomWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        dorms={myDorms.length > 0 ? myDorms : dorms}
        rooms={rooms}
        supervisorName={supervisor.fullName}
        onWarningAdded={onRefreshData}
      />

      <StudentEvaluationModal
        isOpen={isStudentEvalModalOpen}
        onClose={() => {
          setIsStudentEvalModalOpen(false);
          setEvalTargetStudent(null);
        }}
        students={students}
        dorms={myDorms.length > 0 ? myDorms : dorms}
        rooms={rooms}
        initialStudent={evalTargetStudent}
        evaluatorName={supervisor.fullName}
        evaluatorRole="supervisor"
        onSaved={() => {
          setEvalRefreshTick((t) => t + 1);
          onRefreshData();
        }}
      />

      {/* بنر سرپرستی و آمار */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                <Building2 className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-teal-300">پنل مدیریت سرپرستی سرا</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">{supervisor.fullName}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              سراهای تحت نظارت ({myDorms.length} سرا):{' '}
              <span className="font-bold text-teal-200">
                {myDorms.map((d) => d.name).join(' • ')}
              </span>
            </p>
          </div>

          {/* شاخص‌های آماری سرا */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10">
              <span className="block text-[11px] text-teal-200">کل ظرفیت تخت‌ها</span>
              <span className="text-lg font-black text-white">{totalBeds}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10">
              <span className="block text-[11px] text-teal-200">تخت‌های اشغال شده</span>
              <span className="text-lg font-black text-white">{occupiedBeds}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10">
              <span className="block text-[11px] text-emerald-300">تخت‌های خالی</span>
              <span className="text-lg font-black text-emerald-400">{vacantBeds}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10">
              <span className="block text-[11px] text-teal-200">درصد اشغال</span>
              <span className="text-lg font-black text-teal-300">٪{occupancyRate}</span>
            </div>
          </div>
        </div>

        {/* نوار انتخاب سرا در صورتی که سرپرست چند سرا داشته باشد */}
        {myDorms.length > 1 && (
          <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-teal-200">انتخاب سرا جهت مدیریت:</span>
            <button
              onClick={() => setSelectedDormId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedDormId === 'all'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-teal-100'
              }`}
            >
              همه سراهای من ({myDorms.length} سرا)
            </button>
            {myDorms.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDormId(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedDormId === d.id
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-teal-100'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        {/* دکمه‌های اقدام سریع */}
        <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-5 border-t border-white/10">
          <button
            onClick={() => setIsWarningModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>اعلام اخطار به اتاق</span>
          </button>

          <button
            onClick={() => {
              setEvalTargetStudent(null);
              setIsStudentEvalModalOpen(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>تذکر / نمره ارزیابی دانشجو</span>
          </button>

          <button
            onClick={() => setShowAddAnnouncement(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>ارسال اطلاعیه جدید سرا</span>
          </button>

          <button
            onClick={onOpenReports}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>گزارش تخت‌های خالی و آمار</span>
          </button>

          <button
            onClick={onOpenMessages}
            className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>صندوق پیام‌ها و تیکت‌ها</span>
          </button>

          {onOpenUserGuide && (
            <button
              onClick={() => onOpenUserGuide('supervisor')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              title="مشاهده و چاپ دفترچه راهنمای جامع سرپرست سرا (PDF)"
            >
              <BookOpen className="w-4 h-4" />
              <span>راهنمای سرپرست (PDF)</span>
            </button>
          )}

          <button
            onClick={() => {
              setMaintDormId(selectedDormId === 'all' ? (myDorms[0]?.id || '') : selectedDormId);
              setMaintStaffId(allStaff[0]?.id || '');
              setIsAddMaintenanceModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>ثبت خرابی تأسیسات</span>
          </button>
        </div>
      </div>

      {/* پیام بازخورد تأیید یا رد */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* بخش درخواست‌های اسکان موقت در خوابگاه تحت نظارت */}
      {pendingStudentsInMyDorm.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-amber-300 dark:border-amber-800 shadow-xs animate-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  درخواست‌های انتخاب اتاق موقت نیازمند تأیید سرپرستی ({pendingStudentsInMyDorm.length} مورد)
                </h3>
                <p className="text-[11px] text-slate-400">
                  این دانشجویان تختی را در سراهای تحت نظارت شما ({selectedDormId === 'all' ? 'همه سراها' : currentDorm?.name || 'سرا'}) انتخاب کرده‌اند و منتظر بررسی و تأیید نهایی شما هستند.
                </p>
              </div>
            </div>

            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
              title="تأیید قطعی همه درخواست‌های این سرا"
            >
              <CheckCheck className="w-4 h-4" />
              <span>تأیید دسته‌جمعی همه ({pendingStudentsInMyDorm.length})</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingStudentsInMyDorm.map((st) => {
              const room = rooms.find((r) => r.id === st.assignedRoomId);
              const bed = beds.find((b) => b.id === st.assignedBedId);

              return (
                <div
                  key={st.studentId}
                  className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {st.photoUrl ? (
                      <img src={st.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: st.avatarColor || '#0d9488' }}
                      >
                        {st.fullName.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{st.fullName}</div>
                      <div className="text-[10px] text-slate-500">
                        کد دانشجویی: {st.studentId} • {st.fieldOfStudy} • ورودی {st.entryTerm} • {st.city}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/50">
                    <div className="text-left sm:text-right">
                      <span className="font-bold text-teal-700 dark:text-teal-300 block">
                        اتاق {room?.roomNumber || '—'}
                      </span>
                      <span className="text-[10px] text-slate-400">{bed?.label || '—'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleConfirmSingle(st.studentId)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>تأیید قطعی</span>
                      </button>
                      <button
                        onClick={() => handleRejectSingle(st.studentId)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-900"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رد</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* فرم مدال ثبت یا ویرایش اطلاعیه */}
      {showAddAnnouncement && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>{editingAnnId ? 'ویرایش اطلاعیه رسمی سرا' : 'ارسال اطلاعیه جدید برای نمایش در داشبورد دانشجویان'}</span>
            </h3>
            <button onClick={handleCancelEditAnnouncement} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان اطلاعیه
                </label>
                <input
                  type="text"
                  placeholder="مثلاً تغییر ساعت ورود و خروج یا برنامه سم‌پاشی"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اولویت اطلاعیه
                </label>
                <select
                  value={newAnnPriority}
                  onChange={(e) => setNewAnnPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                >
                  <option value="normal">عادی</option>
                  <option value="important">مهم (برچسب زرد)</option>
                  <option value="urgent">فوری و ضروری (برچسب قرمز)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                متن کامل اطلاعیه
              </label>
              <textarea
                rows={3}
                placeholder="متن کامل پیام و دستورالعمل..."
                value={newAnnContent}
                onChange={(e) => setNewAnnContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* پیوست عکس یا پوستر اطلاعیه */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>تصویر یا پوستر اطلاعیه (اختیاری)</span>
              </label>

              <div className="flex items-center gap-3">
                <label className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100">
                  <Upload className="w-3.5 h-3.5 text-teal-600" />
                  <span>انتخاب عکس</span>
                  <input type="file" accept="image/*" onChange={handleAnnImageUpload} className="hidden" />
                </label>

                {newAnnImage && (
                  <div className="flex items-center gap-2">
                    <img src={newAnnImage} alt="پیش‌نمایش" className="w-10 h-10 object-cover rounded-lg border border-teal-500" />
                    <button
                      type="button"
                      onClick={() => setNewAnnImage(null)}
                      className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      حذف
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{editingAnnId ? 'ذخیره تغییرات اطلاعیه' : 'ثبت و انتشار اطلاعیه'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEditAnnouncement}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* تب‌های مدیریت سرپرست */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('manager')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer ${
            activeTab === 'manager'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          مدیریت اتاق‌ها، جابجایی و تعیین نماینده
        </button>

        <button
          onClick={() => setActiveTab('visual_picker')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer ${
            activeTab === 'visual_picker'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          نقشه بصری و تعاملی چیدمان تخت‌ها
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          اطلاعیه‌ها و اخطارهای انضباطی فعال ({warnings.filter((w) => !w.resolved).length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer ${
            activeTab === 'students'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          فهرست دانشجویان و تماس ضروری ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'maintenance'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-500" />
          <span>تأسیسات و تعمیرات سرا</span>
          {activeMaintTasksCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-black animate-pulse">
              {activeMaintTasksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('warehouse')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'warehouse'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4 text-violet-500" />
          <span>تأییدیه قطعات و حواله انبار</span>
          {Storage.getWarehouseRequests().filter(
            (r) =>
              (selectedDormId === 'all' || r.dormId === selectedDormId) &&
              r.status === 'pending_supervisor'
          ).length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 font-black animate-pulse">
              {
                Storage.getWarehouseRequests().filter(
                  (r) =>
                    (selectedDormId === 'all' || r.dormId === selectedDormId) &&
                    r.status === 'pending_supervisor'
                ).length
              }
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'shifts'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-teal-500" />
          <span>دفتر وقایع و گزارش شیفت‌ها</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-extrabold">
            {Storage.getShiftReports().length}
          </span>
        </button>
      </div>

      {/* محتوای تب‌ها */}
      {activeTab === 'manager' && (
        <SupervisorRoomManager
          dorms={myDorms.length > 0 ? myDorms : dorms}
          rooms={rooms}
          beds={beds}
          students={students}
          onDataChanged={onRefreshData}
          supervisorDormId={selectedDormId}
          actorName={supervisor.fullName}
          actorRole="supervisor"
          actorId={supervisor.id}
        />
      )}

      {activeTab === 'visual_picker' && (
        <VisualBedPicker
          dorms={myDorms.length > 0 ? myDorms : dorms}
          rooms={rooms}
          beds={beds}
          students={students}
          settings={settings}
          onBedSelected={onRefreshData}
          isSupervisorMode={true}
          actorName={supervisor.fullName}
          actorRole="supervisor"
          actorId={supervisor.id}
        />
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* لیست اطلاعیه‌های فعال سرا با قابلیت ویرایش توسط سرپرست */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  اطلاعیه‌های سراهای دانشجویی ({announcements.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingAnnId(null);
                  setNewAnnTitle('');
                  setNewAnnContent('');
                  setNewAnnPriority('normal');
                  setNewAnnImage(null);
                  setShowAddAnnouncement(true);
                }}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>ارسال اطلاعیه جدید</span>
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">هیچ اطلاعیه‌ای ثبت نشده است.</div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {ann.priority === 'urgent' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                            فوری
                          </span>
                        ) : ann.priority === 'important' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
                            مهم
                          </span>
                        ) : null}
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ann.title}</h4>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEditAnnouncement(ann)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800 transition flex items-center gap-1 cursor-pointer"
                          title="ویرایش این اطلاعیه"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ویرایش</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="حذف اطلاعیه"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{ann.content}</p>

                    {ann.imageUrl && (
                      <div className="mt-2 max-w-xs overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                        <img src={ann.imageUrl} alt={ann.title} className="w-full max-h-36 object-cover" />
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                      <span>صادرکننده: {ann.author}</span>
                      <span>تاریخ: {ann.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* اخطارها */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>فهرست اخطارها و تذکرات صادره برای اتاق‌ها</span>
            </h3>

            {warnings.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">هیچ اخطاری ثبت نشده است.</div>
            ) : (
              <div className="space-y-3">
                {warnings.map((warn) => {
                  const r = rooms.find((rm) => rm.id === warn.roomId);
                  const d = dorms.find((dm) => dm.id === warn.dormId);

                  return (
                    <div
                      key={warn.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        warn.resolved
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 opacity-70'
                          : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            اتاق {r?.roomNumber} ({d?.name})
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              warn.resolved ? 'bg-slate-200 text-slate-600' : 'bg-rose-600 text-white'
                            }`}
                          >
                            {warn.resolved ? 'برطرف شده' : 'فعال'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{warn.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{warn.description}</p>
                        <span className="text-[10px] text-slate-400 mt-2 block">
                          ثبت توسط: {warn.supervisorName} • {warn.date}
                        </span>
                      </div>

                      {!warn.resolved && (
                        <button
                          onClick={() => handleResolveWarning(warn.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 self-start sm:self-center transition"
                        >
                          ثبت رفع تخلف و بستن اخطار
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* تذکرات، اخطارها و ارزیابی‌های فردی و اتاق دانشجویان */}
          {(() => {
            void evalRefreshTick;
            const myDormIds = (myDorms.length > 0 ? myDorms : dorms).map((d) => d.id);
            const studentEvals: StudentEvaluation[] = Storage.getStudentEvaluations().filter(
              (ev) => !ev.dormId || myDormIds.includes(ev.dormId)
            );
            return (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span>تذکرات، اخطارها و نمرات ارزیابی دانشجویان ({studentEvals.length})</span>
                  </h3>
                  <button
                    onClick={() => {
                      setEvalTargetStudent(null);
                      setIsStudentEvalModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت مورد جدید</span>
                  </button>
                </div>

                {studentEvals.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    هنوز تذکر یا نمره ارزیابی فردی/اتاقی برای دانشجویان ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {studentEvals.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                                ev.type === 'evaluation'
                                  ? 'bg-emerald-600 text-white'
                                  : ev.type === 'report'
                                  ? 'bg-blue-600 text-white'
                                  : ev.type === 'warning'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {ev.type === 'evaluation'
                                ? `نمره: ${ev.score ?? '-'}`
                                : ev.type === 'report'
                                ? 'گزارش'
                                : ev.type === 'warning'
                                ? 'اخطار رسمی'
                                : 'تذکر'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">
                              {ev.scope === 'room' ? 'اتاق' : 'فردی'}
                            </span>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {ev.studentName} ({ev.studentId})
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{ev.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{ev.description}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            ثبت توسط: {ev.evaluatorName} • {ev.date}
                          </div>
                        </div>

                        {(ev.type === 'notice' || ev.type === 'warning') && !ev.resolved && (
                          <button
                            onClick={() => {
                              Storage.resolveStudentEvaluation(ev.id);
                              setEvalRefreshTick((t) => t + 1);
                              onRefreshData();
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                          >
                            ثبت رفع مورد
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <span>فهرست کامل دانشجومعلمان و مشخصات تماس اضطراری</span>
            </h3>
            <button
              onClick={onOpenReports}
              className="text-xs text-teal-600 font-bold hover:underline"
            >
              مشاهده گزارش و خروجی اکسل
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold">
                <tr>
                  <th className="p-3">کد دانشجویی</th>
                  <th className="p-3">نام و نام خانوادگی</th>
                  <th className="p-3">رشته</th>
                  <th className="p-3">ورودی</th>
                  <th className="p-3">وضعیت پرونده</th>
                  <th className="p-3">اتاق/تخت</th>
                  <th className="p-3">شماره همراه</th>
                  <th className="p-3">شماره اضطراری</th>
                  <th className="p-3">شهر سکونت</th>
                  <th className="p-3 text-center">کارت هویت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((st) => {
                  const r = rooms.find((rm) => rm.id === st.assignedRoomId);
                  const b = beds.find((bd) => bd.id === st.assignedBedId);

                  return (
                    <tr key={st.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold">{st.studentId}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{st.fullName}</td>
                      <td className="p-3">{st.fieldOfStudy}</td>
                      <td className="p-3">{st.entryTerm}</td>
                      <td className="p-3">
                        {st.isProfileCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            تکمیل شده
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            ناقص (در انتظار تکمیل)
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {r && b ? (
                          <span className="text-teal-600 font-bold">
                            اتاق {r.roomNumber} ({b.tier === 'lower' ? 'پایین' : 'بالا'})
                          </span>
                        ) : (
                          <span className="text-slate-400">فاقد اتاق</span>
                        )}
                      </td>
                      <td className="p-3" dir="ltr">{st.mobile}</td>
                      <td className="p-3 text-rose-600" dir="ltr">{st.emergencyPhone || '-'}</td>
                      <td className="p-3">{st.province} - {st.city}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEvalTargetStudent(st);
                              setIsStudentEvalModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                            title="ثبت تذکر، اخطار یا نمره ارزیابی دانشجو"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewCardStudent(st)}
                            className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition cursor-pointer"
                            title="مشاهده و چاپ کارت شناسایی و اسکان سرا"
                          >
                            <QrCode className="w-4 h-4" />
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
      )}

      {/* تب تأسیسات و تعمیرات سرا */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* کارت آمار و خلاصه وضعیت تأسیسات این سرا */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-400 block mb-1">کل گزارش‌های تأسیساتی</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{myMaintenanceTasks.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-xs">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 block mb-1">در حال اقدام یا تعمیر</span>
              <span className="text-xl font-black text-amber-600">
                {myMaintenanceTasks.filter((t) => t.status === 'in_progress').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 shadow-xs">
              <span className="text-[11px] text-purple-600 dark:text-purple-400 block mb-1">در انتظار قطعه</span>
              <span className="text-xl font-black text-purple-600">
                {myMaintenanceTasks.filter((t) => t.status === 'parts_needed').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-1">رفع عیب و تکمیل شده</span>
              <span className="text-xl font-black text-emerald-600">
                {myMaintenanceTasks.filter((t) => t.status === 'resolved' || t.status === 'closed').length}
              </span>
            </div>
          </div>

          {/* نوار جستجو و فیلترها و دکمه ثبت مستقیم */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو با کد رهگیری، شماره اتاق، عنوان یا نام دانشجو..."
                  value={maintSearchQuery}
                  onChange={(e) => setMaintSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={maintStatusFilter}
                onChange={(e) => setMaintStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار تخصیص</option>
                <option value="assigned">ارجاع شده به تکنسین</option>
                <option value="in_progress">در حال تعمیر و اقدام</option>
                <option value="parts_needed">نیازمند تأمین قطعه</option>
                <option value="resolved">رفع نقص شده (نیازمند تأیید سرپرست)</option>
              </select>
            </div>

            <button
              onClick={() => {
                setMaintDormId(selectedDormId === 'all' ? (myDorms[0]?.id || '') : selectedDormId);
                setMaintStaffId(allStaff[0]?.id || '');
                setIsAddMaintenanceModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ ثبت مستقیم خرابی توسط سرپرست</span>
            </button>
          </div>

          {/* پیام بازخورد عملیات تأسیساتی */}
          {maintFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{maintFeedback}</span>
            </div>
          )}

          {/* فهرست مأموریت‌های تأسیساتی */}
          {myMaintenanceTasks
            .filter((t) => {
              if (maintStatusFilter !== 'all' && t.status !== maintStatusFilter) return false;
              if (!maintSearchQuery.trim()) return true;
              const q = maintSearchQuery.toLowerCase();
              return (
                t.trackingCode.toLowerCase().includes(q) ||
                t.title.toLowerCase().includes(q) ||
                (t.roomNumber && t.roomNumber.includes(q)) ||
                (t.sourceStudentName && t.sourceStudentName.toLowerCase().includes(q)) ||
                (t.assignedToStaffName && t.assignedToStaffName.toLowerCase().includes(q))
              );
            })
            .length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              هیچ مورد تأسیساتی با فیلترهای انتخابی در این سرا یافت نشد.
            </div>
          ) : (
            <div className="space-y-3.5">
              {myMaintenanceTasks
                .filter((t) => {
                  if (maintStatusFilter !== 'all' && t.status !== maintStatusFilter) return false;
                  if (!maintSearchQuery.trim()) return true;
                  const q = maintSearchQuery.toLowerCase();
                  return (
                    t.trackingCode.toLowerCase().includes(q) ||
                    t.title.toLowerCase().includes(q) ||
                    (t.roomNumber && t.roomNumber.includes(q)) ||
                    (t.sourceStudentName && t.sourceStudentName.toLowerCase().includes(q)) ||
                    (t.assignedToStaffName && t.assignedToStaffName.toLowerCase().includes(q))
                  );
                })
                .map((task) => {
                  const assignedTech = allStaff.find((s) => s.id === task.assignedToStaffId);

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-3xl border transition shadow-xs ${
                        task.status === 'resolved'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                          : task.priority === 'emergency'
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                          : task.status === 'in_progress'
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono text-xs font-black">
                            {task.trackingCode}
                          </span>

                          {task.priority === 'emergency' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                              اورژانسی و اضطراری
                            </span>
                          )}
                          {task.priority === 'urgent' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                              فوری
                            </span>
                          )}

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                              task.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : task.status === 'in_progress'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                : task.status === 'parts_needed'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : task.status === 'assigned'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {task.status === 'resolved'
                              ? 'رفع نقص و انجام شده'
                              : task.status === 'in_progress'
                              ? 'در حال تعمیر و اقدام'
                              : task.status === 'parts_needed'
                              ? 'در انتظار تأمین قطعه'
                              : task.status === 'assigned'
                              ? 'ارجاع شده به تکنسین'
                              : 'در انتظار تعیین تکنسین'}
                          </span>

                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mr-1">
                            {task.dormName} {task.roomNumber ? `• اتاق ${task.roomNumber}` : ''}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          ثبت: {task.createdAt}
                        </div>
                      </div>

                      <div className="py-3">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{task.title}</span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {task.description}
                        </p>
                      </div>

                      {/* گزارش فنی تکنسین یا قطعات مصرفی */}
                      {(task.actionNotes || task.partsReplaced) && (
                        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs space-y-1 mb-3">
                          <span className="font-bold text-amber-900 dark:text-amber-200 block">
                            گزارش و یادداشت فنی تکنسین:
                          </span>
                          {task.actionNotes && (
                            <p className="text-slate-700 dark:text-slate-300">{task.actionNotes}</p>
                          )}
                          {task.partsReplaced && (
                            <p className="text-slate-500 text-[11px]">
                              قطعات مصرفی: {task.partsReplaced}
                              {task.estimatedCost ? ` (هزینه تقریبی: ${Number(task.estimatedCost).toLocaleString('fa-IR')} ریال)` : ''}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* مشخصات منبع گزارش (دانشجو یا سرپرست) */}
                          {task.sourceStudentName ? (
                            <span className="text-slate-500">
                              گزارش‌دهنده: <strong className="text-slate-700 dark:text-slate-200">{task.sourceStudentName}</strong>
                              {task.sourceStudentPhone && ` (${task.sourceStudentPhone})`}
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              ثبت توسط: <strong>{task.createdByName}</strong>
                            </span>
                          )}

                          {/* تکنسین مسئول یا امکان ارجاع مستقیم */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">تکنسین مسئول:</span>
                            <select
                              value={task.assignedToStaffId || ''}
                              onChange={(e) => handleSupervisorAssignTech(task.id, e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">انتخاب / تغییر تکنسین...</option>
                              {allStaff.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.fullName} ({s.specialty})
                                </option>
                              ))}
                            </select>

                            {assignedTech?.mobile && (
                              <a
                                href={`tel:${assignedTech.mobile}`}
                                className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="تماس مستقیم با تکنسین"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* دکمه‌های اقدام سرپرست */}
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          {task.status === 'resolved' && (
                            task.supervisorVerified ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl font-bold text-xs">
                                <CheckCircle className="w-3.5 h-3.5" />
                                تأیید شده توسط سرپرست
                              </span>
                            ) : (
                              <button
                                onClick={() => handleVerifyResolvedTask(task.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                تأیید نهایی رفع عیب
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* تب تأییدیه و کارتابل حواله‌های انبار برای سرپرست */}
      {activeTab === 'warehouse' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* آمار درخواست‌های انبار این سرا */}
          {(() => {
            const allReqs = Storage.getWarehouseRequests().filter(
              (r) => selectedDormId === 'all' || r.dormId === selectedDormId
            );
            const pendingSup = allReqs.filter((r) => r.status === 'pending_supervisor');
            const pendingWh = allReqs.filter((r) => r.status === 'pending_warehouse');
            const issued = allReqs.filter((r) => r.status === 'issued');
            const totalCost = issued.reduce((sum, r) => sum + (r.totalCost || 0), 0);

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-xs">
                    <span className="text-[11px] text-amber-600 block mb-1 font-bold">نیازمند تأیید سرپرست</span>
                    <span className="text-xl font-black text-amber-600">{pendingSup.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">درخواست‌های تکنسین‌ها</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/40 shadow-xs">
                    <span className="text-[11px] text-violet-600 block mb-1 font-bold">در انتظار تحویل انبار</span>
                    <span className="text-xl font-black text-violet-600">{pendingWh.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">تأییدشده و در دست انباردار</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
                    <span className="text-[11px] text-emerald-600 block mb-1 font-bold">تحویل‌شده و بسته</span>
                    <span className="text-xl font-black text-emerald-600">{issued.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">اقلام دریافت‌شده سرا</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[11px] text-slate-500 block mb-1 font-bold">هزینه فاکتور اقلام</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white truncate">
                      {Number(totalCost).toLocaleString('fa-IR')} ریال
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">مجموع خروجی انبار</span>
                  </div>
                </div>

                {/* فهرست درخواست‌های قطعه */}
                {allReqs.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                      هیچ درخواست قطعه‌ای برای این سرا ثبت نشده است.
                    </h4>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allReqs.map((req) => {
                      const isPendingSup = req.status === 'pending_supervisor';
                      const isPendingWh = req.status === 'pending_warehouse';
                      const isIssued = req.status === 'issued';

                      return (
                        <div
                          key={req.id}
                          className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-xs flex flex-col justify-between ${
                            isPendingSup
                              ? 'border-amber-400 ring-2 ring-amber-400/20'
                              : isIssued
                              ? 'border-emerald-200 dark:border-emerald-900/60'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-200">
                                {req.requestCode}
                              </span>
                              {isPendingSup ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-xl bg-amber-100 text-amber-800 font-extrabold animate-pulse">
                                  در انتظار تأیید سرپرست
                                </span>
                              ) : isPendingWh ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-xl bg-violet-100 text-violet-800 font-bold">
                                  ارجاع به انبار
                                </span>
                              ) : isIssued ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                                  تحویل داده شد
                                </span>
                              ) : (
                                <span className="text-[11px] px-2 py-0.5 rounded-xl bg-rose-100 text-rose-800 font-bold">
                                  رد شده
                                </span>
                              )}
                            </div>

                            <h4 className="font-black text-sm text-slate-900 dark:text-white mb-2">
                              {req.itemTitle}
                            </h4>

                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-xs space-y-1 mb-2">
                              <div className="flex justify-between">
                                <span className="text-slate-500">مقدار نیاز:</span>
                                <span className="font-bold text-violet-700">{req.quantityRequested} {req.unit}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">متقاضی:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{req.requestedByStaffName}</span>
                              </div>
                              {req.taskTrackingCode && (
                                <div className="flex justify-between text-amber-700 font-bold">
                                  <span>کد سفارش کار:</span>
                                  <span>{req.taskTrackingCode}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>تاریخ ثبت:</span>
                                <span>{req.requestDate}</span>
                              </div>
                            </div>

                            {req.reason && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <strong>علت نیاز: </strong>
                                {req.reason}
                              </p>
                            )}

                            {isIssued && (
                              <div className="p-2 rounded-xl bg-emerald-50 text-xs text-emerald-900 mb-2">
                                <div className="font-bold">تحویل قطعی: {req.issuedQuantity} {req.unit} به مبلغ {Number(req.totalCost || 0).toLocaleString('fa-IR')} ریال</div>
                                <div className="text-[10px] text-emerald-700">توسط: {req.issuedByStaffName} ({req.issuedAt})</div>
                              </div>
                            )}
                          </div>

                          {/* دکمه‌های اقدام سرپرست */}
                          {isPendingSup && (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                              <button
                                onClick={() => {
                                  const res = Storage.approveWarehouseRequest(req.id, supervisor.fullName, 'تأیید سرپرست سرا جهت اقدام انبار');
                                  if (res.success) {
                                    onRefreshData();
                                  }
                                }}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تأیید و ارسال به انبار</span>
                              </button>

                              <button
                                onClick={() => {
                                  const reason = prompt('علت عدم تأیید درخواست قطعه را بنویسید:');
                                  if (reason) {
                                    Storage.rejectWarehouseRequest(req.id, reason);
                                    onRefreshData();
                                  }
                                }}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>رد</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* تب دفتر وقایع، شیفت‌بندی و گزارشات شیفت سرپرستی */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          {/* کارت وضعیت شیفت فعال این سرپرست */}
          {(() => {
            const mySchedules = Storage.getSupervisorEffectiveShifts(supervisor.id, supervisor.fullName);
            const isDefaultEveryDay = mySchedules.some((s) => s.isEveryDay);
            const allShiftReports = Storage.getShiftReports();

            // فیلتر کردن گزارش‌ها
            const filteredReports = allShiftReports.filter((r) => {
              if (repFilterDorm !== 'all' && r.dormId !== repFilterDorm) return false;
              if (repFilterSupervisor !== 'all' && r.supervisorId !== repFilterSupervisor) return false;
              if (repFilterType !== 'all' && r.shiftType !== repFilterType) return false;
              if (repSearchQuery.trim()) {
                const q = repSearchQuery.toLowerCase().trim();
                const text = `${r.reportCode} ${r.supervisorName} ${r.dormName} ${r.inspectionsSummary} ${r.incidentsSummary || ''} ${r.handoverNotes}`.toLowerCase();
                if (!text.includes(q)) return false;
              }
              return true;
            });

            const dayFaMap: Record<string, string> = {
              saturday: 'شنبه',
              sunday: 'یکشنبه',
              monday: 'دوشنبه',
              tuesday: 'سه‌شنبه',
              wednesday: 'چهارشنبه',
              thursday: 'پنج‌شنبه',
              friday: 'جمعه',
              all: 'تمام روزهای هفته',
            };

            const shiftFaMap: Record<string, string> = {
              morning: 'شیفت صبح (۰۷:۳۰ الی ۱۵:۳۰)',
              evening: 'شیفت عصر (۱۵:۰۰ الی ۲۳:۰۰)',
              night: 'شیفت شب (۲۲:۰۰ الی ۰۷:۳۰)',
              full_day: 'حضور روزانه / ۲۴ ساعته',
            };

            return (
              <>
                {/* بنر وضعیت شیفت و دکمه‌های اقدام سریع */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white shadow-xl border border-teal-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white">
                          دفتر وقایع روزانه و تبادل گزارش‌های بین‌شیفتی سرپرستان
                        </h3>
                        <p className="text-xs text-teal-200/90">
                          سرپرست حاضر: <strong className="text-amber-300 font-bold">{supervisor.fullName}</strong> • سرا: {currentDorm?.name || 'همه سراها'}
                        </p>
                      </div>
                    </div>

                    {/* برچسب شیفت فعال این سرپرست */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-300">وضعیت برنامه حضور شما:</span>
                      {isDefaultEveryDay ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 font-bold flex items-center gap-1.5 shadow-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>حضور روزانه (هر روز) - برنامه پیش‌فرض سازمانی</span>
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {mySchedules.map((sch) => (
                            <span
                              key={sch.id}
                              className="px-2.5 py-1 rounded-lg bg-teal-700/60 text-teal-100 border border-teal-500/40 text-[11px] font-semibold"
                            >
                              {dayFaMap[sch.dayOfWeek] || sch.dayOfWeek} ({shiftFaMap[sch.shiftType] || sch.shiftType})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* دکمه‌های اکشن */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setRepShiftDate(new Date().toLocaleDateString('fa-IR'));
                        setRepShiftDormId(selectedDormId === 'all' ? (myDorms[0]?.id || '') : selectedDormId);
                        setIsAddShiftReportModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/25 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ثبت گزارش شیفت و دفتر وقایع</span>
                    </button>

                    <button
                      onClick={() => exportShiftReportsToExcel(filteredReports)}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="دانلود خروجی اکسل گزارش‌ها"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="hidden sm:inline">خروجی اکسل</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition cursor-pointer"
                      title="چاپ دفتر وقایع شیفت"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* نوار فیلتر و جستجوی گزارش‌های شیفت */}
                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>گزارش‌گیری و پایش دفتر وقایع ({filteredReports.length} گزارش ثبت‌شده)</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* فیلتر سرپرست */}
                      <select
                        value={repFilterSupervisor}
                        onChange={(e) => setRepFilterSupervisor(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="all">همه سرپرستان</option>
                        {Storage.getSupervisors().map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName}
                          </option>
                        ))}
                      </select>

                      {/* فیلتر سرا */}
                      <select
                        value={repFilterDorm}
                        onChange={(e) => setRepFilterDorm(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="all">همه سراها</option>
                        {dorms.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>

                      {/* فیلتر نوع شیفت */}
                      <select
                        value={repFilterType}
                        onChange={(e) => setRepFilterType(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="all">همه نوبت‌های شیفت</option>
                        <option value="morning">شیفت صبح</option>
                        <option value="evening">شیفت عصر</option>
                        <option value="night">شیفت شب</option>
                        <option value="full_day">شیفت ۲۴ ساعته / روزانه</option>
                      </select>
                    </div>
                  </div>

                  {/* نوار جستجوی متنی */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="جستجو در شرح بازرسی‌ها، حوادث، نکات تحویل شیفت یا کد گزارش..."
                      value={repSearchQuery}
                      onChange={(e) => setRepSearchQuery(e.target.value)}
                      className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* فهرست دفتر وقایع روزانه (قابل مشاهده توسط همه سرپرستان) */}
                {filteredReports.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      هیچ گزارش شیفتی مطابق فیلترهای تعیین‌شده یافت نشد.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      می‌توانید با زدن دکمه «ثبت گزارش شیفت و دفتر وقایع»، اولین گزارش شیفت این سرا را ثبت نمایید.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReports.map((report) => {
                      const isMyReport = report.supervisorId === supervisor.id;

                      return (
                        <div
                          key={report.id}
                          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-teal-500/50 transition"
                        >
                          {/* سربرگ کارت گزارش */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-bold text-teal-700 dark:text-teal-300 text-xs shrink-0">
                                {report.supervisorName.slice(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {report.supervisorName}
                                  </h4>
                                  {isMyReport && (
                                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[10px] font-bold">
                                      گزارش شما
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  {report.dormName} • زمان ثبت سیستمی: {report.createdAt}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold" dir="ltr">
                                {report.reportCode}
                              </span>

                              <span className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold">
                                📅 {report.shiftDate} ({shiftFaMap[report.shiftType] || report.shiftType})
                              </span>

                              {report.shiftTime && (
                                <span className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px] font-mono">
                                  ⏰ {report.shiftTime}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* محتوای گزارش شیفت */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* خلاصه بازرسی‌ها */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                                <span>🔍 خلاصه بازرسی اتاق‌ها و وضعیت عمومی سرا:</span>
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                                {report.inspectionsSummary}
                              </p>
                              {report.presentStudentCount && (
                                <span className="inline-block mt-1 text-[10px] font-bold text-slate-400">
                                  تعداد ساکنین حاضر در شیفت: {report.presentStudentCount} دانشجو
                                </span>
                              )}
                            </div>

                            {/* حوادث یا وضعیت آرامش */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                <span>⚠️ حوادث، فوریت‌ها یا موارد انضباطی:</span>
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                                {report.incidentsSummary || 'در طول این شیفت هیچ‌گونه حادثه، فوریت پزشکی یا تخلف انضباطی رخ نداد و آرامش کامل برقرار بود.'}
                              </p>
                            </div>
                          </div>

                          {/* بخش برجسته: تحویل به شیفت بعدی (Handover Notes) */}
                          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800 text-xs space-y-1">
                            <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                              <span>🤝 نکات کلیدی جهت تحویل به سرپرست شیفت بعد:</span>
                            </span>
                            <p className="text-amber-950 dark:text-amber-100 font-medium leading-relaxed">
                              {report.handoverNotes}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* مدال ثبت گزارش شیفت و دفتر وقایع روزانه */}
      {isAddShiftReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-teal-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ثبت گزارش شیفت و دفتر وقایع روزانه سرپرستی
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    این گزارش در دفتر وقایع ذخیره شده و برای اطلاع سایر سرپرستان شیفت‌های بعد قابل مشاهده خواهد بود.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddShiftReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShiftReport} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سرای محل حضور:
                  </label>
                  <select
                    value={repShiftDormId || currentDorm?.id || ''}
                    onChange={(e) => setRepShiftDormId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  >
                    {myDorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ شیفت (شمسی):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: ۱۴۰۵/۰۷/۱۵"
                    value={repShiftDate}
                    onChange={(e) => setRepShiftDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوبت شیفت:
                  </label>
                  <select
                    value={repShiftType}
                    onChange={(e) => setRepShiftType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="morning">شیفت صبح (۰۷:۳۰ الی ۱۵:۳۰)</option>
                    <option value="evening">شیفت عصر (۱۵:۰۰ الی ۲۳:۰۰)</option>
                    <option value="night">شیفت شب (۲۲:۰۰ الی ۰۷:۳۰)</option>
                    <option value="full_day">شیفت ۲۴ ساعته / روزانه</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ساعت دقیق حضور یا بازه شیفت:
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً ۱۵:۰۰ الی ۲۳:۰۰"
                    value={repShiftTime}
                    onChange={(e) => setRepShiftTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تعداد تخمینی دانشجومعلمان حاضر در سرا:
                </label>
                <input
                  type="number"
                  value={repStudentCount}
                  onChange={(e) => setRepStudentCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  خلاصه بازرسی اتاق‌ها، سالن مطالعه و وضعیت عمومی سرا:
                </label>
                <textarea
                  rows={3}
                  placeholder="شرح بازدید از طبقات، وضعیت نظافت مشاعات، روشنایی و تأسیسات، آرامش ساعات استراحت..."
                  value={repInspections}
                  onChange={(e) => setRepInspections(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  حوادث، فوریت‌های پزشکی یا موارد انضباطی (در صورت وجود):
                </label>
                <textarea
                  rows={2}
                  placeholder="در صورت عدم وجود مورد خاص، خالی بگذارید یا بنویسید: آرامش کامل برقرار بود."
                  value={repIncidents}
                  onChange={(e) => setRepIncidents(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-700 dark:text-amber-400 mb-1">
                  نکات کلیدی جهت تحویل به سرپرست شیفت بعد (الزامی):
                </label>
                <textarea
                  rows={3}
                  placeholder="کلیدهای تحویلی، مأموریت‌های در دست پیگیری تأسیسات، مرخصی‌های دارای تأخیر، هماهنگی‌های لازم با همکار شیفت بعد..."
                  value={repHandover}
                  onChange={(e) => setRepHandover(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddShiftReportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>ثبت در دفتر وقایع سرا</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال ثبت مستقیم خرابی تأسیساتی توسط سرپرست */}
      {isAddMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 dark:border-amber-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ثبت مستقیم خرابی و ارجاع به تأسیسات
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    صدور مأموریت جدید کارشناسان تأسیسات برای سرای تحت نظارت
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMaintenanceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectMaintenance} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان نقص یا خرابی تأسیساتی
                </label>
                <input
                  type="text"
                  placeholder="مثلاً نشت آب شیر روشویی، قطعی برق اتاق، خرابی قفل..."
                  value={maintTitle}
                  onChange={(e) => setMaintTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سرای دانشجویی
                  </label>
                  <select
                    value={maintDormId}
                    onChange={(e) => setMaintDormId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    {myDorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره اتاق یا موقعیت
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً 305 یا راهرو طبقه اول"
                    value={maintRoomNumber}
                    onChange={(e) => setMaintRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حوزه تخصصی
                  </label>
                  <select
                    value={maintCategory}
                    onChange={(e) => setMaintCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="plumbing">لوله کشی، شیرآلات، فاضلاب و موتورخانه</option>
                    <option value="electrical">برق، روشنایی، آسانسور و کلیدپریز</option>
                    <option value="carpentry">نجاری، درب، پنجره، قفل و کمد</option>
                    <option value="facilities">سرمایش، گرمایش، شوفاژ و کولر</option>
                    <option value="other">سایر امور فنی و ساختمانی</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اولویت رسیدگی
                  </label>
                  <select
                    value={maintPriority}
                    onChange={(e) => setMaintPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری</option>
                    <option value="emergency">اضطراری و بحرانی (اورژانسی)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تکنسین مسئول (ارجاع مستقیم)
                </label>
                <select
                  value={maintStaffId}
                  onChange={(e) => setMaintStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">بدون انتصاب مستقیم (ارجاع به سرپرست واحد تأسیسات)</option>
                  {allStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شرح دقیق مشکل و نکات مورد نیاز
                </label>
                <textarea
                  rows={3}
                  placeholder="جزئیات خرابی، وسایل احتمالی مورد نیاز..."
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>ثبت و صدور مأموریت تأسیسات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddMaintenanceModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال مشاهده و پرینت کارت خوابگاه توسط سرپرست */}
      {viewCardStudent && (
        <DormIdCardModal
          isOpen={!!viewCardStudent}
          onClose={() => setViewCardStudent(null)}
          student={viewCardStudent}
          dorm={dorms.find((d) => d.id === viewCardStudent.assignedDormId)}
          room={rooms.find((r) => r.id === viewCardStudent.assignedRoomId)}
          bed={beds.find((b) => b.id === viewCardStudent.assignedBedId)}
          settings={settings}
        />
      )}

    </div>
  );
};
