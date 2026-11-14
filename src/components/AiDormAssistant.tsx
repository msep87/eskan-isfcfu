import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Sparkles,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Loader2,
  Globe,
  HelpCircle,
} from 'lucide-react';
import {
  Announcement,
  AppSettings,
  Bed,
  CurrentUser,
  DayOfWeek,
  Dormitory,
  Room,
  Student,
} from '../types';
import { Storage } from '../utils/storage';

const AI_CHAT_ENDPOINT = 'https://khabgah-api.vercel.app/api/ai-chat';

interface GroundingSource {
  title: string;
  uri: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
  timestamp: string;
  isError?: boolean;
}

interface AiDormAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  settings: AppSettings;
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  announcements: Announcement[];
}

const DAY_LABELS: Record<DayOfWeek | 'all', string> = {
  all: 'همه روزهای هفته',
  saturday: 'شنبه',
  sunday: 'یکشنبه',
  monday: 'دوشنبه',
  tuesday: 'سه‌شنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنج‌شنبه',
  friday: 'جمعه',
};

const SHIFT_TYPE_LABELS: Record<string, string> = {
  morning: 'شیفت صبح',
  evening: 'شیفت عصر',
  night: 'شیفت شب',
  full_day: 'شبانه روزی (۲۴ ساعته)',
};

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: 'welcome_msg',
  role: 'model',
  text:
    'سلام! من دستیار هوشمند خوابگاهی و آموزشی سامانه سراهای دانشجویی دانشگاه فرهنگیان اصفهان هستم.\n' +
    'می‌توانید درباره وضعیت سراها و ظرفیت اتاق‌ها، میانگین امتیاز اتاق‌ها، اطلاعیه‌ها، برنامه حضور سرپرستان و مشاوران یا هرگونه سوال آموزشی، علمی و خوابگاهی از من بپرسید.',
  timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
};

export const AiDormAssistant: React.FC<AiDormAssistantProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  dorms,
  rooms,
  beds,
  students,
  announcements,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  // ساخت کانتکست عمومی کاملاً امن (بدون ارسال هیچ اطلاعات محرمانه یا هویتی سایر کاربران)
  const publicContext = useMemo(() => {
    const evaluations = Storage.getStudentEvaluations();
    const supervisorShifts = Storage.getShiftSchedules();
    const counselorShifts = Storage.getCounselorShifts();
    const counselors = Storage.getCounselors();

    const dormMap = new Map(dorms.map((d) => [d.id, d]));

    // ساخت نگاشت امن نمره‌های قبلی دانشجویان بر اساس studentId صرفاً برای محاسبه میانگین اتاق (نام و مشخصات حذف می‌شود)
    const studentPrevScoreMap = new Map<string, number>();
    students.forEach((st) => {
      const numericScore = Number(st.previousScore);
      if (Number.isFinite(numericScore)) {
        studentPrevScoreMap.set(st.studentId, numericScore);
      }
    });

    const bedsByRoom = new Map<string, Bed[]>();
    beds.forEach((b) => {
      const arr = bedsByRoom.get(b.roomId) || [];
      arr.push(b);
      bedsByRoom.set(b.roomId, arr);
    });

    const roomsByDorm = new Map<string, Room[]>();
    rooms.forEach((r) => {
      const arr = roomsByDorm.get(r.dormId) || [];
      arr.push(r);
      roomsByDorm.set(r.dormId, arr);
    });

    const dormsSummary = dorms.map((dorm) => {
      const dormRooms = roomsByDorm.get(dorm.id) || [];
      const dormBeds = beds.filter((b) => b.dormId === dorm.id);
      const totalBeds = dormBeds.length;
      const occupiedBeds = dormBeds.filter((b) => Boolean(b.studentId)).length;
      const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
      const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

      return {
        name: dorm.name,
        campus: dorm.campus,
        gender: dorm.gender === 'brothers' ? 'برادران' : 'خواهران',
        totalFloors: dorm.totalFloors,
        supervisorName: dorm.supervisorName || 'تعیین نشده',
        address: dorm.address || '',
        description: dorm.description || '',
        roomCount: dormRooms.length,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        occupancyPercent: occupancyRate,
      };
    });

    // آمار و میانگین نمرات اتاق‌ها بدون هیچ‌گونه نام، کد ملی یا شناسه ساکنین
    const roomsSummary = rooms.map((room) => {
      const dorm = dormMap.get(room.dormId);
      const roomBeds = bedsByRoom.get(room.id) || [];
      const totalCapacity = roomBeds.length > 0 ? roomBeds.length : room.capacity;
      const occupiedBeds = roomBeds.filter((b) => Boolean(b.studentId));
      const occupiedCount = occupiedBeds.length;
      const vacantCount = Math.max(0, totalCapacity - occupiedCount);

      // میانگین امتیاز سال قبل ساکنین فعلی اتاق (کاملاً ناشناس)
      const prevScores: number[] = [];
      occupiedBeds.forEach((b) => {
        if (b.studentId && studentPrevScoreMap.has(b.studentId)) {
          prevScores.push(studentPrevScoreMap.get(b.studentId)!);
        }
      });
      const previousScoreAverage =
        prevScores.length > 0
          ? Number((prevScores.reduce((sum, val) => sum + val, 0) / prevScores.length).toFixed(1))
          : null;

      // میانگین نمرات ارزیابی ثبت‌شده برای این اتاق یا ساکنین این اتاق (فقط اعداد نمره، بدون تذکر/اخطار یا نام افراد)
      const occupantIds = new Set(
        occupiedBeds.map((b) => b.studentId).filter((id): id is string => Boolean(id))
      );
      const roomEvalScores = evaluations
        .filter(
          (ev) =>
            ev.type === 'evaluation' &&
            typeof ev.score === 'number' &&
            (ev.roomId === room.id || occupantIds.has(ev.studentId))
        )
        .map((ev) => ev.score as number);

      const evaluationScoreAverage =
        roomEvalScores.length > 0
          ? Number(
              (roomEvalScores.reduce((sum, val) => sum + val, 0) / roomEvalScores.length).toFixed(1)
            )
          : null;

      const compactRoom: Record<string, unknown> = {
        dorm: dorm?.name || 'نامشخص',
        room: room.roomNumber,
        floor: room.floor,
        cap: totalCapacity,
        occ: occupiedCount,
        vac: vacantCount,
      };
      if (room.status === 'maintenance') compactRoom.status = 'در حال تعمیر';
      else if (room.status === 'inactive') compactRoom.status = 'غیرفعال';
      if (room.allowedFields && room.allowedFields.length > 0) {
        compactRoom.fields = room.allowedFields;
      }
      if (room.allowedEntryTerms && room.allowedEntryTerms.length > 0) {
        compactRoom.terms = room.allowedEntryTerms;
      }
      if (previousScoreAverage !== null) {
        compactRoom.prevAvg = previousScoreAverage;
      }
      if (evaluationScoreAverage !== null) {
        compactRoom.evalAvg = evaluationScoreAverage;
      }
      return compactRoom;
    });

    const totalBedsAll = beds.length;
    const occupiedBedsAll = beds.filter((b) => Boolean(b.studentId)).length;

    const publicAnnouncements = announcements
      .filter((a) => currentUser !== null || a.showOnHomePage !== false)
      .slice(0, 8)
      .map((a) => ({
        title: a.title,
        content: a.content.length > 260 ? `${a.content.slice(0, 260)}...` : a.content,
        priority: a.priority === 'urgent' ? 'فوری' : a.priority === 'important' ? 'مهم' : 'عادی',
        date: a.date,
        targetDorm:
          !a.targetDormId || a.targetDormId === 'all'
            ? 'همه سراها'
            : dormMap.get(a.targetDormId)?.name || 'سرای مشخص',
      }));

    const supervisorShiftsSummary = supervisorShifts.map((sh) => ({
      supervisorName: sh.supervisorName,
      dormName: sh.dormName || dormMap.get(sh.dormId)?.name || 'نامشخص',
      dayOfWeek: DAY_LABELS[sh.dayOfWeek] || sh.dayOfWeek,
      shiftType: SHIFT_TYPE_LABELS[sh.shiftType] || sh.shiftType,
      timeRange:
        sh.startTime && sh.endTime ? `${sh.startTime} تا ${sh.endTime}` : 'طبق برنامه شیفت',
      notes: sh.notes || '',
    }));

    const counselorMap = new Map(counselors.map((c) => [c.id, c]));
    const counselorShiftsSummary = counselorShifts.map((cs) => {
      const cInfo = counselorMap.get(cs.counselorId);
      return {
        counselorName: cs.counselorName,
        specialty: cInfo?.specialty || 'مشاوره دانشجویی',
        location:
          cs.campusOrDormName ||
          cs.dormName ||
          (cs.dormId ? dormMap.get(cs.dormId)?.name : undefined) ||
          cInfo?.officeLocation ||
          'مرکز مشاوره',
        roomNumber: cs.roomNumber || cInfo?.roomNumber || '',
        dayOfWeek: DAY_LABELS[cs.dayOfWeek] || cs.dayOfWeek,
        date: cs.date || '',
        timeRange: `${cs.startTime} تا ${cs.endTime}`,
        shiftTitle: cs.shiftTitle || 'مشاوره فردی و خوابگاهی',
      };
    });

    // فقط در صورتی که خود دانشجو لاگین کرده است، اطلاعات اسکان خودِ او فرستاده می‌شود (بدون کد ملی، تلفن، نشانی یا اسامی هم‌اتاقی‌ها)
    let currentUserContext: Record<string, unknown> = { role: 'guest' };
    if (currentUser?.role === 'student') {
      const st = currentUser.student;
      const assignedDorm = st.assignedDormId ? dormMap.get(st.assignedDormId) : undefined;
      const assignedRoom = st.assignedRoomId
        ? rooms.find((r) => r.id === st.assignedRoomId)
        : undefined;
      const assignedBed = st.assignedBedId ? beds.find((b) => b.id === st.assignedBedId) : undefined;

      const ownEvaluations = evaluations
        .filter((ev) => ev.studentId === st.studentId && ev.type === 'evaluation')
        .map((ev) => ({
          title: ev.title,
          scope: ev.scope === 'room' ? 'ارزیابی اتاق' : 'ارزیابی فردی',
          score: ev.score,
          date: ev.date,
        }));

      currentUserContext = {
        role: 'student',
        fullName: st.fullName,
        fieldOfStudy: st.fieldOfStudy,
        entryTerm: st.entryTerm,
        previousScore: st.previousScore,
        previousDorm: st.previousDorm || '',
        previousRoom: st.previousRoom || '',
        assignmentStatus:
          st.assignmentStatus === 'confirmed'
            ? 'قطعی‌شده'
            : st.assignmentStatus === 'temporary'
            ? 'موقت (در انتظار تایید)'
            : 'بدون تخت انتخاب‌شده',
        assignedDormName: assignedDorm?.name || st.assignedDormName || 'انتخاب نشده',
        assignedRoomNumber: assignedRoom?.roomNumber || st.assignedRoomNumber || 'انتخاب نشده',
        assignedBedLabel: assignedBed?.label || (st.assignedBedNumber ? `تخت ${st.assignedBedNumber}` : 'انتخاب نشده'),
        ownEvaluations,
      };
    } else if (currentUser) {
      currentUserContext = {
        role: currentUser.role,
        note: 'کاربر از کادر یا مدیریت سامانه است؛ هیچ اطلاعات هویتی/حساس کاربران در کانتکست عمومی قرار نگرفته است.',
      };
    }

    return {
      academicInfo: {
        universityName: settings.universityName,
        currentAcademicYear: settings.currentAcademicYear,
        currentSemester: settings.currentSemester,
        selectionActive: settings.selectionActive,
        selectionStartDate: settings.selectionStartDate,
        selectionEndDate: settings.selectionEndDate,
        announcementBanner: settings.announcementBanner || '',
      },
      overallStats: {
        totalDorms: dorms.length,
        totalRooms: rooms.length,
        totalBeds: totalBedsAll,
        occupiedBeds: occupiedBedsAll,
        vacantBeds: Math.max(0, totalBedsAll - occupiedBedsAll),
        occupancyPercent:
          totalBedsAll > 0 ? Math.round((occupiedBedsAll / totalBedsAll) * 100) : 0,
        registeredStudentsCount: students.length,
      },
      dormsSummary,
      roomsSummary,
      publicAnnouncements,
      supervisorShiftsSummary,
      counselorShiftsSummary,
      currentUserContext,
    };
  }, [currentUser, settings, dorms, rooms, beds, students, announcements]);

  const quickPrompts = useMemo(() => {
    const basePrompts = [
      {
        label: 'وضعیت سراها و ظرفیت',
        query: 'وضعیت کلی سراها، تعداد اتاق‌ها و ظرفیت خالی و پر در حال حاضر چگونه است؟',
      },
      {
        label: 'آخرین اطلاعیه‌ها',
        query: 'آخرین اطلاعیه‌های مهم و زمان‌بندی انتخاب اتاق در سامانه چیست؟',
      },
      {
        label: 'برنامه حضور سرپرستان و مشاوران',
        query: 'برنامه حضور سرپرستان سراها و شیفت مشاوران به چه صورت است؟',
      },
      {
        label: 'سوالات آموزشی و علمی',
        query: 'نکات مهم برای برنامه‌ریزی درسی و زندگی خوابگاهی موفق در دانشگاه فرهنگیان چیست؟',
      },
    ];

    if (currentUser?.role === 'student') {
      basePrompts.unshift({
        label: 'وضعیت اسکان و امتیاز من',
        query: 'وضعیت فعلی اتاق، تخت و میانگین نمرات ارزیابی اتاق من چگونه است؟',
      });
    }

    return basePrompts;
  }, [currentUser]);

  const sendMessage = async (textToSend?: string) => {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed || isLoading) return;

    const nowTime = new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: nowTime,
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome_msg' && !m.isError)
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) {
      setInput('');
    }
    setShowQuickPrompts(false);
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 35000);

      const response = await fetch(AI_CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          publicContext,
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({} as Record<string, unknown>));

      if (!response.ok) {
        const errMessage =
          typeof data?.error === 'string'
            ? data.error
            : typeof data?.message === 'string'
            ? data.message
            : typeof data?.reply === 'string'
            ? data.reply
            : 'در حال حاضر ارتباط با سرویس دستیار هوشمند با خطا مواجه شد.';
        throw new Error(errMessage);
      }

      const replyText =
        typeof data?.reply === 'string' && data.reply.trim()
          ? data.reply.trim()
          : 'پاسخی از سرویس هوشمند دریافت نشد. لطفاً سوال خود را مجدداً مطرح کنید.';

      const rawSources: unknown[] = Array.isArray(data?.sources) ? data.sources : [];
      const cleanSources: GroundingSource[] = rawSources
        .filter(
          (s: unknown): s is { title?: string; uri?: string } =>
            Boolean(s && typeof s === 'object' && 'uri' in s)
        )
        .map((s: { title?: string; uri?: string }): GroundingSource => ({
          title: (typeof s.title === 'string' && s.title.trim()) || (typeof s.uri === 'string' ? s.uri : '') || 'منبع وب',
          uri: typeof s.uri === 'string' ? s.uri : '',
        }))
        .filter((s: GroundingSource) => s.uri.startsWith('http://') || s.uri.startsWith('https://'));

      const assistantMsg: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        text: replyText,
        sources: cleanSources.length > 0 ? cleanSources : undefined,
        timestamp: new Date().toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: unknown) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const fallbackMsg = isTimeout
        ? 'زمان پاسخ‌گویی سرور دستیار هوشمند به پایان رسید. لطفاً چند لحظه دیگر دوباره تلاش نمایید.'
        : error instanceof Error && error.message
        ? error.message
        : 'امکان برقراری ارتباط با سرور دستیار هوشمند (khabgah-api) وجود ندارد. لطفاً مطمئن شوید مسیر /api/ai-chat در بک‌اند فعال شده است.';

      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'model',
          text: fallbackMsg,
          timestamp: new Date().toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...INITIAL_ASSISTANT_MESSAGE,
        id: `welcome_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setShowQuickPrompts(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="دستیار هوشمند خوابگاهی و آموزشی"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-[620px] max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden"
      >
        {/* هدر چت‌بات */}
        <div className="bg-gradient-to-l from-teal-800 via-teal-700 to-cyan-700 text-white px-4 py-3.5 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold truncate">
                  دستیار هوشمند خوابگاهی و آموزشی
                </h3>
                <p className="text-[11px] text-teal-100 truncate flex items-center gap-1">
                  <Globe className="w-3 h-3 shrink-0" />
                  <span>پاسخگویی سریع با اطلاعات لحظه‌ای سامانه و دانش علمی</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                title="شروع گفتگوی جدید"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                title="بستن دستیار"
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* نوار اطلاع‌رسانی حفظ حریم خصوصی */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">حریم خصوصی کاربران محافظت‌شده است (بدون افشای اطلاعات حساس)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickPrompts((prev) => !prev)}
              className="text-teal-700 dark:text-teal-400 font-bold hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>پیشنهادها</span>
            </button>
          </div>

          {/* تاریخچه مکالمه */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-teal-700 text-white rounded-tr-sm'
                        : msg.isError
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/80 rounded-tl-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                    {/* نمایش لینک منابع جستجوی اینترنتی در صورت وجود */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>منابع وب مرتبط:</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {msg.sources.map((src, idx) => (
                            <a
                              key={`${msg.id}_src_${idx}`}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 hover:bg-teal-50 dark:hover:bg-teal-950/50 border border-slate-200/70 dark:border-slate-700 text-[11px] text-teal-700 dark:text-teal-300 transition"
                            >
                              <span className="truncate font-medium">{src.title}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1 tabular-nums">
                    {isUser ? 'شما' : 'دستیار هوشمند'} · {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* دکمه‌های پیشنهاد سریع */}
            {showQuickPrompts && !isLoading && (
              <div className="pt-1">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                  سوالات پیشنهادی سریع:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((qp) => (
                    <button
                      key={qp.label}
                      type="button"
                      onClick={() => void sendMessage(qp.query)}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-slate-700 transition cursor-pointer shadow-2xs"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* وضعیت لودینگ / در حال جستجو */}
            {isLoading && (
              <div className="flex flex-col items-end">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 shadow-xs">
                  <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                  <span>در حال بررسی اطلاعات سامانه و تنظیم پاسخ...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* فرم ارسال پیام */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="سوال خود را درباره سراها، اتاق‌ها یا موضوعات علمی بنویسید..."
                disabled={isLoading}
                className="flex-1 resize-none max-h-28 min-h-[42px] px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-600 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="ارسال پیام"
                className="h-[42px] px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4 rotate-180" />
                <span className="hidden sm:inline">ارسال</span>
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};
