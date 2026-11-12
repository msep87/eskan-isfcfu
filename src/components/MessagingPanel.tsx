import React, { useState } from 'react';
import { Message, CurrentUser, MaintenanceStaff, Dormitory } from '../types';
import { Storage } from '../utils/storage';
import {
  MessageSquare,
  Send,
  CornerDownLeft,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Shield,
  Filter,
  Wrench,
  Sparkles,
  CheckCheck,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface MessagingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: NonNullable<CurrentUser>;
  messages: Message[];
  onMessagesUpdated: () => void;
}

export const MessagingPanel: React.FC<MessagingPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  messages,
  onMessagesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');

  // فرم پیام جدید
  const [receiverType, setReceiverType] = useState<'supervisor' | 'admin' | 'counselor'>('supervisor');
  const [category, setCategory] = useState<Message['category']>('accommodation');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);

  // فیلتر دسته‌بندی صندوق پیام‌ها
  const [inboxCategoryFilter, setInboxCategoryFilter] = useState<string>('all');

  // پاسخ‌دهی به تیکت
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // مودال ارجاع به واحد تأسیسات
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [referTaskTitle, setReferTaskTitle] = useState('');
  const [referTaskDesc, setReferTaskDesc] = useState('');
  const [referDormId, setReferDormId] = useState('');
  const [referRoomNumber, setReferRoomNumber] = useState('');
  const [referPriority, setReferPriority] = useState<'normal' | 'urgent' | 'emergency'>('normal');
  const [referStaffId, setReferStaffId] = useState('');
  const [referNotes, setReferNotes] = useState('');
  const [referFeedback, setReferFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const dorms = Storage.getDormitories();
  const maintenanceStaff = Storage.getMaintenanceStaff().filter((s) => s.status === 'active' || s.isActive !== false);

  // فیلتر کردن پیام‌های مرتبط با کاربر با رعایت حریم خصوصی گزارش‌های محرمانه
  const userMessages = messages.filter((m) => {
    // گزارش محرمانه برای دانشجو، سرپرست، مشاور و مدیر قابل رویت است
    if (m.isConfidential && currentUser.role !== 'student' && currentUser.role !== 'supervisor' && currentUser.role !== 'admin' && currentUser.role !== 'counselor') {
      return false;
    }

    if (currentUser.role === 'student') {
      return m.senderId === currentUser.student.studentId || m.receiverId === currentUser.student.studentId;
    }
    if (currentUser.role === 'supervisor') {
      return m.receiverType === 'supervisor' || m.senderRole === 'supervisor' || m.receiverType === 'all';
    }
    if (currentUser.role === 'counselor') {
      return m.receiverType === 'counselor' || m.category === 'counseling' || m.category === 'social_personal' || m.senderRole === 'counselor';
    }
    if (currentUser.role === 'maintenance') {
      return m.category === 'maintenance' || m.receiverType === 'all' || m.senderRole === 'maintenance';
    }
    if (currentUser.role === 'warehouse') {
      return m.receiverType === 'warehouse' || m.senderRole === 'warehouse';
    }
    return true; // admin sees all
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    let senderName = '';
    let senderId = '';
    let senderRole: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor' = 'student';

    if (currentUser.role === 'student') {
      senderName = currentUser.student.fullName;
      senderId = currentUser.student.studentId;
      senderRole = 'student';
    } else if (currentUser.role === 'supervisor') {
      senderName = currentUser.supervisor.fullName;
      senderId = currentUser.supervisor.id;
      senderRole = 'supervisor';
    } else if (currentUser.role === 'counselor') {
      senderName = `${currentUser.counselor.fullName} (مشاور مرکز)`;
      senderId = currentUser.counselor.id;
      senderRole = 'counselor';
    } else if (currentUser.role === 'maintenance') {
      senderName = `${currentUser.technician.fullName} (تکنسین تأسیسات - ${currentUser.technician.specialty})`;
      senderId = currentUser.technician.id;
      senderRole = 'maintenance';
    } else if (currentUser.role === 'warehouse') {
      senderName = `${currentUser.staff.fullName} (انبار و کارپردازی)`;
      senderId = currentUser.staff.id;
      senderRole = 'warehouse';
    } else {
      senderName = currentUser.name;
      senderId = currentUser.username;
      senderRole = 'admin';
    }

    Storage.addMessage({
      senderId,
      senderName,
      senderRole,
      receiverType,
      subject: subject.trim(),
      content: content.trim(),
      category,
      isConfidential: isConfidential || category === 'social_personal',
      date: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    });

    setSubject('');
    setContent('');
    setIsConfidential(false);
    setActiveTab('inbox');
    onMessagesUpdated();
  };

  const handleSendReply = (messageId: string) => {
    if (!replyText.trim()) return;

    let senderName = '';
    let senderRole: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' = 'supervisor';

    if (currentUser.role === 'student') {
      senderName = currentUser.student.fullName;
      senderRole = 'student';
    } else if (currentUser.role === 'supervisor') {
      senderName = `${currentUser.supervisor.fullName} (سرپرست سرا)`;
      senderRole = 'supervisor';
    } else if (currentUser.role === 'maintenance') {
      senderName = `${currentUser.technician.fullName} (کارشناس تأسیسات - ${currentUser.technician.specialty})`;
      senderRole = 'maintenance';
    } else if (currentUser.role === 'warehouse') {
      senderName = `${currentUser.staff.fullName} (مسئول انبار و کارپردازی)`;
      senderRole = 'warehouse';
    } else {
      senderName = 'مدیریت کل سراها';
      senderRole = 'admin';
    }

    Storage.replyToMessage(messageId, {
      senderName,
      senderRole,
      content: replyText.trim(),
      date: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    });

    setReplyText('');
    onMessagesUpdated();
  };

  const handleOpenReferModal = (msg: Message) => {
    // استخراج اطلاعات خوابگاه و اتاق دانشجو در صورت وجود
    const allStudents = Storage.getStudents();
    const allRooms = Storage.getRooms();
    const st = allStudents.find((s) => s.studentId === msg.senderId);
    let matchedDormId = dorms[0]?.id || '';
    let matchedRoomNum = '';

    if (st && st.assignedDormId) {
      matchedDormId = st.assignedDormId;
      if (st.assignedRoomId) {
        const roomObj = allRooms.find((r) => r.id === st.assignedRoomId);
        matchedRoomNum = roomObj ? roomObj.roomNumber : '';
      }
    } else if (currentUser.role === 'supervisor') {
      const supDormId = currentUser.supervisor.assignedDormIds?.[0] || currentUser.supervisor.assignedDormId;
      if (supDormId && supDormId !== 'all') {
        matchedDormId = supDormId;
      }
    }

    setReferTaskTitle(`تعمیر و رفع نقص: ${msg.subject}`);
    setReferTaskDesc(msg.content);
    setReferDormId(matchedDormId);
    setReferRoomNumber(matchedRoomNum);
    setReferPriority(msg.category === 'maintenance' ? 'urgent' : 'normal');
    setReferStaffId(maintenanceStaff[0]?.id || '');
    setReferNotes('');
    setIsReferModalOpen(true);
  };

  const handleConfirmReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMsg || !referTaskTitle.trim() || !referDormId) return;

    const dormObj = dorms.find((d) => d.id === referDormId);
    const dormName = dormObj ? dormObj.name : 'سرای دانشجویی';
    const staffObj = maintenanceStaff.find((s) => s.id === referStaffId);

    const allStudents = Storage.getStudents();
    const studentObj = allStudents.find((s) => s.studentId === selectedMsg.senderId);

    const createdById =
      currentUser.role === 'supervisor'
        ? currentUser.supervisor.id
        : currentUser.role === 'admin'
        ? currentUser.username
        : 'admin';
    const createdByName =
      currentUser.role === 'supervisor'
        ? currentUser.supervisor.fullName
        : currentUser.role === 'admin'
        ? currentUser.name
        : 'مدیر سرا';
    const createdByRole: 'supervisor' | 'admin' = currentUser.role === 'supervisor' ? 'supervisor' : 'admin';

    const fullDesc = referNotes.trim()
      ? `${referTaskDesc.trim()}\n\nیادداشت سرپرست ارجاع‌دهنده:\n${referNotes.trim()}`
      : referTaskDesc.trim();

    const result = Storage.referMessageToMaintenance(selectedMsg.id, {
      title: referTaskTitle.trim(),
      description: fullDesc,
      dormId: referDormId,
      dormName,
      roomNumber: referRoomNumber.trim() || undefined,
      locationDetails: referRoomNumber.trim() ? `اتاق ${referRoomNumber.trim()}` : undefined,
      priority: referPriority,
      assignedToStaffId: staffObj?.id,
      assignedToStaffName: staffObj?.fullName,
      createdById,
      createdByName,
      createdByRole,
      studentId: selectedMsg.senderId,
      studentName: selectedMsg.senderName,
      studentPhone: studentObj?.phone,
    });

    if (result.success) {
      setReferFeedback(`مأموریت با موفقیت ارجاع شد! کد رهگیری: ${result.task.trackingCode}`);
      setTimeout(() => {
        setIsReferModalOpen(false);
        setReferFeedback(null);
      }, 1500);
      onMessagesUpdated();
    } else {
      alert(result.message);
    }
  };

  const selectedMsg = userMessages.find((m) => m.id === selectedMessageId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] flex flex-col">

        {/* سربرگ */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                سامانه پیام‌ها و تیکت‌های پشتیبانی سرا
              </h3>
              <p className="text-xs text-slate-500">ارتباط مستقیم دانشجومعلمان با سرپرستان و مدیر سامانه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* تب‌ها */}
        <div className="flex items-center gap-2 py-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              setActiveTab('inbox');
              setSelectedMessageId(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'inbox'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            پیام‌های دریافتی و ارسالی ({userMessages.length})
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'compose'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>ارسال پیام جدید</span>
          </button>
        </div>

        {/* بدنه محتوا */}
        <div className="flex-1 overflow-y-auto py-4">

          {/* تب ارسال پیام جدید */}
          {activeTab === 'compose' && (
            <form onSubmit={handleSendMessage} className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  گیرنده پیام
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiverType('supervisor')}
                    className={`flex-1 min-w-[120px] p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      receiverType === 'supervisor'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    سرپرست خوابگاه
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiverType('counselor');
                      setCategory('counseling' as any);
                    }}
                    className={`flex-1 min-w-[120px] p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      receiverType === 'counselor'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    مشاور و روانشناس سرا
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiverType('admin')}
                    className={`flex-1 min-w-[120px] p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      receiverType === 'admin'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    مدیریت کل سراهای دانشگاه
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  موضوع یا حوزه‌ درخواست *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 mb-2 font-medium"
                >
                  <option value="counseling">🧠 مشاوره روانشناختی، سلامت روان، دوری از خانه و استرس تحصیلی</option>
                  <option value="accommodation">🏠 امور اسکان، رزرو و انتخاب اتاق یا جابجایی تخت</option>
                  <option value="maintenance">🔧 خرابی تأسیسات، لوله‌کشی، برق، گرمایش و تعمیرات ابنیه</option>
                  <option value="services_cleaning">🧹 خدمات، نظافت و بهداشت سرا (نظافت راهرو/سرویس، سم‌پاشی، زباله)</option>
                  <option value="rights_violation">⚠️ عدم رعایت حقوق دیگران (سر و صدا و عدم سکوت شبانه، آزار، وسایل مشترک)</option>
                  <option value="social_personal">🤝 آسیب‌های فردی و اجتماعی، ناسازگاری هم‌اتاقی و گزارش موارد خاص</option>
                  <option value="discipline">📋 مقررات و ضوابط انضباطی خوابگاه</option>
                  <option value="request">✉️ درخواست مرخصی و مجوز تردد شبانه</option>
                  <option value="other">📌 سایر امور و پیشنهادات</option>
                </select>

                <input
                  type="text"
                  placeholder="عنوان خلاصه پیام..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  متن پیام یا گزارش شما *
                </label>
                <textarea
                  rows={4}
                  placeholder="متن کامل پیام یا گزارش را با بیان شفاف بنویسید..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* گزینه ارسال محرمانه ویژه حفظ حریم خصوصی */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfidential || category === 'social_personal' || category === 'rights_violation'}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                    🔒 ارسال به عنوان گزارش محرمانه (حفظ هویت و رازداری)
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 block mt-0.5 leading-relaxed">
                    این گزارش منحصراً توسط سرپرست سرا و مدیریت کل قابل بررسی بوده و هویت شما نزد سایر هم‌اتاقی‌ها و دانشجویان کاملاً محفوظ و محرمانه خواهد ماند.
                  </span>
                </div>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-teal-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>ارسال پیام</span>
              </button>
            </form>
          )}

          {/* تب لیست پیام‌ها و مشاهده گفتگو */}
          {activeTab === 'inbox' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">

              {/* ستون لیست گفتگوها همراه با فیلتر دسته‌بندی */}
              <div className="md:col-span-1 border-l border-slate-100 dark:border-slate-800 pl-2 space-y-2 overflow-y-auto max-h-[55vh]">
                {/* فیلتر دسته‌بندی پیام‌ها */}
                <div className="mb-2">
                  <select
                    value={inboxCategoryFilter}
                    onChange={(e) => setInboxCategoryFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold"
                  >
                    <option value="all">همه دسته‌ها ({userMessages.length})</option>
                    <option value="counseling">مشاوره روانشناختی و فردی</option>
                    <option value="maintenance">تأسیسات و تعمیرات</option>
                    <option value="services_cleaning">خدمات و نظافت</option>
                    <option value="rights_violation">عدم رعایت حقوق دیگران</option>
                    <option value="social_personal">مشاوره و آسیب‌های فردی/اجتماعی</option>
                    <option value="accommodation">امور اسکان</option>
                    <option value="discipline">انضباطی</option>
                    <option value="request">مرخصی و تردد</option>
                  </select>
                </div>

                {userMessages.filter((m) => inboxCategoryFilter === 'all' || m.category === inboxCategoryFilter).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    هیچ پیامی در این دسته ثبت نشده است.
                  </div>
                ) : (
                  userMessages
                    .filter((m) => inboxCategoryFilter === 'all' || m.category === inboxCategoryFilter)
                    .map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => setSelectedMessageId(msg.id)}
                        className={`w-full text-right p-3 rounded-2xl border text-xs transition block ${
                          selectedMessageId === msg.id
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100 truncate">
                            {msg.isConfidential && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold" title="گزارش محرمانه">
                                🔒 محرمانه
                              </span>
                            )}
                            <span className="truncate">{msg.senderName}</span>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold shrink-0 ${
                              msg.status === 'answered'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {msg.status === 'answered' ? 'پاسخ داده شد' : 'در انتظار پاسخ'}
                          </span>
                        </div>

                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {msg.subject}
                        </div>

                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {msg.category === 'maintenance'
                              ? 'تأسیسات'
                              : msg.category === 'services_cleaning'
                              ? 'خدمات و نظافت'
                              : msg.category === 'rights_violation'
                              ? 'حقوق دیگران'
                              : msg.category === 'social_personal'
                              ? 'مشاوره/آسیب‌ها'
                              : msg.category === 'accommodation'
                              ? 'اسکان'
                              : msg.category === 'discipline'
                              ? 'انضباطی'
                              : 'عمومی'}
                          </span>
                          <span>{msg.date.split('-')[0]}</span>
                        </div>
                      </button>
                    ))
                )}
              </div>

              {/* ستون جزئیات پیام انتخاب شده و پاسخ */}
              <div className="md:col-span-2 flex flex-col justify-between">
                {selectedMsg ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {selectedMsg.senderName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {selectedMsg.senderRole === 'student'
                              ? 'دانشجو'
                              : selectedMsg.senderRole === 'supervisor'
                              ? 'سرپرست'
                              : selectedMsg.senderRole === 'maintenance'
                              ? 'تأسیسات'
                              : selectedMsg.senderRole === 'warehouse'
                              ? 'انبار'
                              : 'مدیر'}
                          </span>
                          {selectedMsg.isConfidential && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold flex items-center gap-1">
                              <span>🔒 گزارش محرمانه و محافظت‌شده</span>
                            </span>
                          )}
                          {selectedMsg.category === 'maintenance' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold flex items-center gap-1">
                              <Wrench className="w-3 h-3" />
                              <span>مربوط به تأسیسات و خرابی</span>
                            </span>
                          )}
                          {selectedMsg.category === 'services_cleaning' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold">
                              <span>خدمات، بهداشت و نظافت سرا</span>
                            </span>
                          )}
                          {selectedMsg.category === 'rights_violation' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                              <span>گزارش عدم رعایت حقوق دیگران و مزاحمت</span>
                            </span>
                          )}
                          {selectedMsg.category === 'social_personal' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold">
                              <span>مشاوره روحی، ناسازگاری و آسیب‌های فردی/اجتماعی</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{selectedMsg.date}</span>
                          {(currentUser.role === 'supervisor' || currentUser.role === 'admin') && (
                            <button
                              onClick={() => handleOpenReferModal(selectedMsg)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                              title="ارجاع این مشکل به پرسنل تأسیسات با صدور مأموریت و کد رهگیری"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>ارجاع به تأسیسات</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <h4 className="font-extrabold text-xs text-teal-800 dark:text-teal-300 mb-1">
                        موضوع: {selectedMsg.subject}
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedMsg.content}
                      </p>
                    </div>

                    {/* پاسخ‌ها */}
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {selectedMsg.replies.map((reply) => {
                        const isMaint = reply.senderRole === 'maintenance';
                        return (
                          <div
                            key={reply.id}
                            className={`p-3 rounded-2xl border mr-4 text-xs ${
                              isMaint
                                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                                : 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span className={isMaint ? 'text-amber-900 dark:text-amber-200 flex items-center gap-1' : 'text-teal-900 dark:text-teal-200'}>
                                {isMaint && <Wrench className="w-3 h-3 text-amber-600 shrink-0" />}
                                <span>{reply.senderName}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">{reply.date}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {reply.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* کادر ارسال پاسخ */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                      <input
                        type="text"
                        placeholder="پاسخ خود را بنویسید..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply(selectedMsg.id)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-teal-500"
                      />
                      <button
                        onClick={() => handleSendReply(selectedMsg.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span>ارسال پاسخ</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 p-8">
                    یک پیام را از ستون کناری انتخاب کنید تا جزئیات و پاسخ‌ها نمایش داده شود.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* مودال ارجاع مستقیم پیام به پرسنل تأسیسات */}
        {isReferModalOpen && selectedMsg && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 dark:border-amber-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      ارجاع درخواست دانشجو به واحد تأسیسات
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      صدور خودکار مأموریت با کد رهگیری و ارسال پیام به دانشجو
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReferModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {referFeedback && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{referFeedback}</span>
                </div>
              )}

              <form onSubmit={handleConfirmReferral} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان مأموریت تعمیر
                  </label>
                  <input
                    type="text"
                    value={referTaskTitle}
                    onChange={(e) => setReferTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500 font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      سرای دانشجویی
                    </label>
                    <select
                      value={referDormId}
                      onChange={(e) => setReferDormId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      {dorms.map((d) => (
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
                      placeholder="مثلاً 204 یا موتورخانه"
                      value={referRoomNumber}
                      onChange={(e) => setReferRoomNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      تکنسین مسئول (ارجاع مستقیم)
                    </label>
                    <select
                      value={referStaffId}
                      onChange={(e) => setReferStaffId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">بدون انتصاب (ارجاع به سرپرست واحد تأسیسات)</option>
                      {maintenanceStaff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اولویت اقدام
                    </label>
                    <select
                      value={referPriority}
                      onChange={(e) => setReferPriority(e.target.value as any)}
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
                    توضیحات و یادداشت تکمیلی سرپرست به تکنسین
                  </label>
                  <textarea
                    rows={2}
                    placeholder="نکات دسترسی، هماهنگی با نماینده اتاق، ابزار خاص مورد نیاز..."
                    value={referNotes}
                    onChange={(e) => setReferNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>صدور مأموریت و ارجاع</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReferModalOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
