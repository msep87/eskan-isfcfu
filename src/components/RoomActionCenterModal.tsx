import React, { useEffect, useState } from 'react';
import { Dormitory, Room, Student, MessageCategory, DisciplinaryViolationType } from '../types';
import { Storage, DISCIPLINARY_VIOLATION_PRESETS } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import {
  X,
  MessageSquare,
  MessageSquareWarning,
  ShieldAlert,
  Megaphone,
  TrendingDown,
  Award,
  CheckCircle2,
  AlertTriangle,
  Users,
  Send,
  Save,
  Gavel,
} from 'lucide-react';

export type RoomActionMode =
  | 'message'
  | 'notice'
  | 'warning'
  | 'summons'
  | 'negative_score'
  | 'direct_scores'
  | 'disciplinary_referral';

interface RoomActionCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dorm?: Dormitory;
  room: Room | null;
  occupants: Student[];
  actorName: string;
  actorRole: 'admin' | 'supervisor';
  actorId?: string;
  initialMode?: RoomActionMode;
  onDataChanged: () => void;
}

export const RoomActionCenterModal: React.FC<RoomActionCenterModalProps> = ({
  isOpen,
  onClose,
  dorm,
  room,
  occupants,
  actorName,
  actorRole,
  actorId,
  initialMode = 'warning',
  onDataChanged,
}) => {
  const [mode, setMode] = useState<RoomActionMode>(initialMode);
  const [targetAll, setTargetAll] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sendInboxMessage, setSendInboxMessage] = useState(true);
  const [alsoAddRoomWarning, setAlsoAddRoomWarning] = useState(true);

  // فراخوانی
  const [summonsTarget, setSummonsTarget] = useState<'supervisor' | 'disciplinary_council' | 'security'>('supervisor');
  const [summonsSchedule, setSummonsSchedule] = useState('');

  // نمره منفی
  const [negCategory, setNegCategory] = useState<'discipline' | 'cleanliness' | 'both'>('discipline');
  const [negPoints, setNegPoints] = useState('5');

  // تنظیم مستقیم نمرات اتاق
  const [directDisciplineScore, setDirectDisciplineScore] = useState('100');
  const [directCleanlinessScore, setDirectCleanlinessScore] = useState('100');

  // معرفی به شورای انضباطی (ارسال به امور دانشجویی)
  const [violationType, setViolationType] = useState<DisciplinaryViolationType>('curfew_violation');

  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !room) return;
    setMode(initialMode);
    setTargetAll(true);
    setSelectedStudentIds(occupants.map((o) => o.studentId));
    if (initialMode === 'disciplinary_referral') {
      const defPreset = DISCIPLINARY_VIOLATION_PRESETS[0];
      setViolationType(defPreset?.type || 'curfew_violation');
      setTitle(defPreset?.label || 'معرفی به شورای انضباطی');
      setDescription(defPreset?.defaultText || '');
    } else {
      setTitle('');
      setDescription('');
    }
    setSendInboxMessage(true);
    setAlsoAddRoomWarning(true);
    setSummonsTarget('supervisor');
    setSummonsSchedule('');
    setNegCategory('discipline');
    setNegPoints('5');
    setDirectDisciplineScore(String(room.disciplineScore ?? 100));
    setDirectCleanlinessScore(String(room.cleanlinessScore ?? 100));
    setFeedback(null);
  }, [isOpen, room?.id, initialMode]);

  if (!isOpen || !room) return null;

  const targetedOccupants = targetAll
    ? occupants
    : occupants.filter((o) => selectedStudentIds.includes(o.studentId));

  const toggleStudent = (sid: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]
    );
  };

  const summonsTargetLabels: Record<'supervisor' | 'disciplinary_council' | 'security', string> = {
    supervisor: 'دفتر سرپرستی سرا',
    disciplinary_council: 'شورای انضباطی دانشگاه',
    security: 'حراست دانشگاه',
  };

  const presetTitles: Record<RoomActionMode, string[]> = {
    message: [
      `اطلاعیه و پیام سرپرستی برای اتاق ${room.roomNumber}`,
      'تأکید بر رعایت مقررات سکونت و آرامش خوابگاه',
      'هماهنگی جهت نظافت و بازدید دوره‌ای اتاق',
    ],
    notice: [
      'تذکر رعایت نظافت فردی و اجتماعی اتاق',
      'تذکر رعایت مقررات سکونت و ساعت تردد',
      'تذکر رعایت آرامش و سکوت در ساعات مطالعه و استراحت',
    ],
    warning: [
      'اخطار رسمی عدم رعایت مقررات سکونت و رفت و آمد',
      'اخطار رسمی وضعیت نامطلوب نظافت و بهداشت اتاق',
      'اخطار رسمی نقض نظم و آسیب به تجهیزات اتاق',
    ],
    summons: [
      'فراخوانی فوری جهت ادای توضیحات و پیگیری مورد انضباطی',
      'فراخوانی جهت بررسی گزارش رفت و آمد و حضور غیرمجاز',
      'فراخوانی جهت رسیدگی به وضعیت نظم و نگهداری اموال اتاق',
    ],
    negative_score: [
      'کسر نمره بابت عدم رعایت مقررات سکونت و رفت و آمد',
      'کسر نمره بابت عدم رعایت نظافت فردی و اجتماعی اتاق',
      'کسر نمره بابت بی‌نظمی و تأخیر در تردد شبانه',
    ],
    direct_scores: [],
    disciplinary_referral: [],
  };

  const applyViolationPreset = (type: DisciplinaryViolationType) => {
    setViolationType(type);
    const preset = DISCIPLINARY_VIOLATION_PRESETS.find((p) => p.type === type);
    if (preset) {
      setTitle(preset.label);
      setDescription(preset.defaultText);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (mode === 'direct_scores') {
      const dScore = Number(toEnglishDigits(directDisciplineScore));
      const cScore = Number(toEnglishDigits(directCleanlinessScore));
      if (
        Number.isNaN(dScore) ||
        dScore < 0 ||
        dScore > 100 ||
        Number.isNaN(cScore) ||
        cScore < 0 ||
        cScore > 100
      ) {
        setFeedback({ ok: false, msg: 'نمرات اتاق باید عددی معتبر بین ۰ تا ۱۰۰ باشند.' });
        return;
      }
      const res = Storage.updateRoomScores(
        room.id,
        { disciplineScore: dScore, cleanlinessScore: cScore },
        actorName,
        actorRole
      );
      setFeedback({ ok: res.success, msg: res.message });
      onDataChanged();
      return;
    }

    if (occupants.length > 0 && !targetAll && targetedOccupants.length === 0) {
      setFeedback({ ok: false, msg: 'حداقل یک دانشجو را انتخاب کنید یا گزینه «کل اتاق و همه ساکنین» را فعال نمایید.' });
      return;
    }

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();

    if (!cleanTitle) {
      setFeedback({ ok: false, msg: 'لطفاً عنوان اقدام یا پیام را وارد نمایید.' });
      return;
    }

    const nowFa = new Date().toLocaleDateString('fa-IR');

    if (mode === 'message') {
      if (targetedOccupants.length === 0) {
        setFeedback({ ok: false, msg: 'این اتاق در حال حاضر ساکنی ندارد تا پیام به صندوق پیام او ارسال شود.' });
        return;
      }
      if (!cleanDesc) {
        setFeedback({ ok: false, msg: 'متن پیام نمی‌تواند خالی باشد.' });
        return;
      }
      targetedOccupants.forEach((st) => {
        Storage.addMessage({
          senderId: actorId || actorRole,
          senderName: actorName,
          senderRole: actorRole,
          receiverType: 'student',
          receiverId: st.studentId,
          subject: cleanTitle,
          content: `${cleanDesc}\n(${dorm?.name || 'سرا'} • اتاق ${room.roomNumber})`,
          category: 'discipline',
          date: nowFa,
        });
      });
      Storage.addActivityLog({
        category: 'student',
        action: `ارسال پیام گروهی/موردی به اتاق ${room.roomNumber}`,
        details: `پیام «${cleanTitle}» برای ${targetedOccupants.length} نفر از ساکنین اتاق ${room.roomNumber} (${dorm?.name || ''}) ارسال شد.`,
        targetName: `اتاق ${room.roomNumber}`,
        actorName,
        actorRole,
      });
      setFeedback({
        ok: true,
        msg: `پیام با موفقیت برای ${targetedOccupants.length} دانشجوی اتاق ${room.roomNumber} ارسال شد.`,
      });
      setTitle('');
      setDescription('');
      onDataChanged();
      return;
    }

    if (mode === 'negative_score') {
      const pts = Number(toEnglishDigits(negPoints));
      if (Number.isNaN(pts) || pts <= 0 || pts > 100) {
        setFeedback({ ok: false, msg: 'مقدار نمره منفی باید عددی مثبت بین ۰.۵ تا ۱۰۰ باشد.' });
        return;
      }
      const res = Storage.applyRoomNegativeScore({
        roomId: room.id,
        category: negCategory,
        negativePoints: pts,
        targetStudentIds: targetedOccupants.map((s) => s.studentId),
        title: cleanTitle,
        description: cleanDesc || cleanTitle,
        actorName,
        actorRole,
        actorId,
        sendMessage: sendInboxMessage,
      });
      setFeedback({ ok: res.success, msg: res.message });
      if (res.success) {
        setTitle('');
        setDescription('');
        onDataChanged();
      }
      return;
    }

    if (mode === 'disciplinary_referral') {
      if (targetedOccupants.length === 0) {
        setFeedback({ ok: false, msg: 'حداقل یک دانشجوی ساکن را برای معرفی به شورای انضباطی انتخاب نمایید.' });
        return;
      }
      const preset = DISCIPLINARY_VIOLATION_PRESETS.find((p) => p.type === violationType);
      const res = Storage.createDisciplinaryReferral({
        students: targetedOccupants,
        dorm,
        room,
        violationType,
        violationLabel: cleanTitle || preset?.label,
        referralText: cleanDesc || preset?.defaultText || cleanTitle,
        referredById: actorId || actorRole,
        referredByName: actorName,
        referredByRole: actorRole,
        notifyStudentInbox: sendInboxMessage,
      });
      setFeedback({ ok: res.success, msg: res.message });
      if (res.success) {
        onDataChanged();
      }
      return;
    }

    // حالت‌های notice، warning، summons
    const evalType = mode === 'summons' ? 'summons' : mode === 'warning' ? 'warning' : 'notice';
    const fullDesc =
      mode === 'summons'
        ? `${cleanDesc || cleanTitle}${summonsSchedule.trim() ? ` | موعد مراجعه: ${summonsSchedule.trim()}` : ''}`
        : cleanDesc || cleanTitle;

    if (targetedOccupants.length > 0) {
      targetedOccupants.forEach((st) => {
        Storage.addStudentEvaluation(
          {
            studentId: st.studentId,
            studentName: st.fullName,
            dormId: dorm?.id || room.dormId,
            dormName: dorm?.name || st.assignedDormName,
            roomId: room.id,
            roomNumber: room.roomNumber,
            type: evalType,
            scope: targetAll ? 'room' : 'individual',
            summonsTarget: mode === 'summons' ? summonsTarget : undefined,
            summonsSchedule: mode === 'summons' ? summonsSchedule.trim() || undefined : undefined,
            title:
              mode === 'summons'
                ? `فراخوانی به ${summonsTargetLabels[summonsTarget]}: ${cleanTitle}`
                : cleanTitle,
            description: fullDesc,
            evaluatorName: actorName,
            evaluatorRole: actorRole,
          },
          false
        );

        if (sendInboxMessage) {
          const msgCat: MessageCategory = 'discipline';
          Storage.addMessage({
            senderId: actorId || actorRole,
            senderName: actorName,
            senderRole: actorRole,
            receiverType: 'student',
            receiverId: st.studentId,
            subject:
              mode === 'summons'
                ? `فراخوانی رسمی به ${summonsTargetLabels[summonsTarget]}`
                : mode === 'warning'
                ? `اخطار رسمی اتاق ${room.roomNumber}: ${cleanTitle}`
                : `تذکر انضباطی اتاق ${room.roomNumber}: ${cleanTitle}`,
            content: `${fullDesc}\n(${dorm?.name || 'سرا'} • اتاق ${room.roomNumber})`,
            category: msgCat,
            date: nowFa,
          });
        }
      });
    }

    if ((mode === 'warning' && alsoAddRoomWarning) || targetedOccupants.length === 0) {
      Storage.addRoomWarning({
        dormId: dorm?.id || room.dormId,
        roomId: room.id,
        title:
          mode === 'summons'
            ? `فراخوانی به ${summonsTargetLabels[summonsTarget]}: ${cleanTitle}`
            : cleanTitle,
        description: fullDesc,
        severity: mode === 'notice' ? 'info' : 'warning',
        date: nowFa,
        supervisorName: actorName,
        resolved: false,
      });
    }

    const modeTitleFa =
      mode === 'summons'
        ? `فراخوانی به ${summonsTargetLabels[summonsTarget]}`
        : mode === 'warning'
        ? 'اخطار رسمی'
        : 'تذکر';

    setFeedback({
      ok: true,
      msg: `${modeTitleFa} برای اتاق ${room.roomNumber}${
        targetedOccupants.length > 0 ? ` (${targetedOccupants.length} دانشجو)` : ''
      } با موفقیت ثبت شد.`,
    });
    setTitle('');
    setDescription('');
    setSummonsSchedule('');
    onDataChanged();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مدال */}
        <div className="p-5 sm:p-6 bg-gradient-to-l from-slate-900 via-indigo-950 to-teal-900 text-white rounded-t-3xl flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>
                اقدامات انضباطی، پیام، فراخوانی و نمرات — اتاق {room.roomNumber} ({dorm?.name || 'سرا'})
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white/15 font-bold">
                نمره انضباط و مقررات سکونت و رفت و آمد: {room.disciplineScore ?? 100} / ۱۰۰
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/15 font-bold">
                نمره نظافت فردی و اجتماعی: {room.cleanlinessScore ?? 100} / ۱۰۰
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 text-xs">
          {/* انتخاب نوع اقدام */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              type="button"
              onClick={() => setMode('message')}
              className={`p-2.5 rounded-2xl border font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                mode === 'message'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>ارسال پیام</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('notice')}
              className={`p-2.5 rounded-2xl border font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                mode === 'notice'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <MessageSquareWarning className="w-4 h-4" />
              <span>ثبت تذکر</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('warning')}
              className={`p-2.5 rounded-2xl border font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                mode === 'warning'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>ثبت اخطار</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('summons')}
              className={`p-2.5 rounded-2xl border font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                mode === 'summons'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>فراخوانی</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('negative_score')}
              className={`p-2.5 rounded-2xl border font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                mode === 'negative_score'
                  ? 'bg-red-700 text-white border-red-700 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>نمره منفی</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('disciplinary_referral');
                applyViolationPreset(violationType);
              }}
              className={`p-2.5 rounded-2xl border font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                mode === 'disciplinary_referral'
                  ? 'bg-orange-700 text-white border-orange-700 shadow-sm'
                  : 'bg-orange-50/70 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200'
              }`}
            >
              <Gavel className="w-4 h-4" />
              <span className="text-[11px] leading-tight text-center">شورای انضباطی</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('direct_scores')}
              className={`p-2.5 rounded-2xl border font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                mode === 'direct_scores'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>نمرات اتاق</span>
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border font-bold flex items-center gap-2 ${
                feedback.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
              }`}
            >
              {feedback.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* انتخاب مخاطب (برای همه مودها بجز تنظیم مستقیم نمره اتاق) */}
            {mode !== 'direct_scores' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>مخاطب و مشمولین اقدام در اتاق {room.roomNumber}:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetAll(true);
                        setSelectedStudentIds(occupants.map((o) => o.studentId));
                      }}
                      className={`px-3 py-1 rounded-xl font-bold cursor-pointer ${
                        targetAll
                          ? 'bg-teal-600 text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      کل اتاق و همه ساکنین ({occupants.length} نفر)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetAll(false)}
                      disabled={occupants.length === 0}
                      className={`px-3 py-1 rounded-xl font-bold cursor-pointer disabled:opacity-50 ${
                        !targetAll
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      انتخاب دانشجویان مشخص
                    </button>
                  </div>
                </div>

                {occupants.length === 0 ? (
                  <div className="text-[11px] text-slate-500">
                    این اتاق در حال حاضر ساکنی ندارد؛ اقدام برای پرونده اتاق ثبت خواهد شد.
                  </div>
                ) : (
                  !targetAll && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {occupants.map((st) => (
                        <label
                          key={st.studentId}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                            selectedStudentIds.includes(st.studentId)
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(st.studentId)}
                            onChange={() => toggleStudent(st.studentId)}
                            className="w-4 h-4 accent-indigo-600 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {st.fullName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              کد: {st.studentId} • امتیاز فعلی: {st.previousScore ?? 100}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* بخش تنظیم مستقیم نمرات دوگانه اتاق */}
            {mode === 'direct_scores' ? (
              <div className="space-y-4 p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                      نمره انضباط و رعایت مقررات سکونت و رفت و آمد (۰ تا ۱۰۰)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={directDisciplineScore}
                      onChange={(e) => setDirectDisciplineScore(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 font-mono font-bold text-center text-base"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                      نمره رعایت نظافت فردی و اجتماعی اتاق (۰ تا ۱۰۰)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={directCleanlinessScore}
                      onChange={(e) => setDirectCleanlinessScore(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 font-mono font-bold text-center text-base"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره نمرات جدید اتاق</span>
                </button>
              </div>
            ) : (
              <>
                {/* گزینه‌های اختصاصی فراخوانی */}
                {mode === 'summons' && (
                  <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                    <label className="block font-extrabold text-purple-950 dark:text-purple-100">
                      مرجع فراخوانی دانشجو / اتاق:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'supervisor', label: 'فراخوانی به سرپرستی سرا' },
                          { id: 'disciplinary_council', label: 'فراخوانی به شورای انضباطی' },
                          { id: 'security', label: 'فراخوانی به حراست دانشگاه' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSummonsTarget(opt.id)}
                          className={`py-2.5 px-3 rounded-xl border-2 font-bold transition cursor-pointer ${
                            summonsTarget === opt.id
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        تاریخ، ساعت و محل دقیق حضور (اختیاری)
                      </label>
                      <input
                        type="text"
                        value={summonsSchedule}
                        onChange={(e) => setSummonsSchedule(e.target.value)}
                        placeholder="مثلاً سه‌شنبه ساعت ۱۰:۳۰ صبح - دفتر سرپرستی / شورای انضباطی"
                        className="w-full px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* گزینه‌های اختصاصی نمره منفی */}
                {mode === 'negative_score' && (
                  <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-3">
                    <div>
                      <label className="block font-extrabold text-rose-950 dark:text-rose-100 mb-1.5">
                        محور کسر نمره منفی:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setNegCategory('discipline')}
                          className={`py-2 px-3 rounded-xl border font-bold cursor-pointer ${
                            negCategory === 'discipline'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          انضباط و مقررات سکونت و رفت و آمد
                        </button>
                        <button
                          type="button"
                          onClick={() => setNegCategory('cleanliness')}
                          className={`py-2 px-3 rounded-xl border font-bold cursor-pointer ${
                            negCategory === 'cleanliness'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          رعایت نظافت فردی و اجتماعی
                        </button>
                        <button
                          type="button"
                          onClick={() => setNegCategory('both')}
                          className={`py-2 px-3 rounded-xl border font-bold cursor-pointer ${
                            negCategory === 'both'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          کسر همزمان از هر دو محور
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">میزان کسر نمره:</span>
                      {['2', '5', '10', '15', '20'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setNegPoints(val)}
                          className={`px-3 py-1 rounded-xl font-black cursor-pointer ${
                            negPoints === val
                              ? 'bg-red-700 text-white'
                              : 'bg-white dark:bg-slate-900 border border-rose-200 text-rose-700'
                          }`}
                        >
                          {val}- امتیاز
                        </button>
                      ))}
                      <input
                        type="number"
                        min="0.5"
                        max="100"
                        step="0.5"
                        value={negPoints}
                        onChange={(e) => setNegPoints(e.target.value)}
                        className="w-24 px-2.5 py-1 rounded-xl border border-rose-300 bg-white dark:bg-slate-900 font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                )}

                {/* گزینه‌های اختصاصی معرفی به شورای انضباطی */}
                {mode === 'disciplinary_referral' && (
                  <div className="p-4 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="font-extrabold text-orange-950 dark:text-orange-100 flex items-center gap-1.5">
                        <Gavel className="w-4 h-4 text-orange-600" />
                        <span>انتخاب نوع تخلف انضباطی (ارسال مستقیم به کارتابل امور دانشجویی):</span>
                      </label>
                    </div>
                    <select
                      value={violationType}
                      onChange={(e) => applyViolationPreset(e.target.value as DisciplinaryViolationType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-orange-500"
                    >
                      {DISCIPLINARY_VIOLATION_PRESETS.map((preset) => (
                        <option key={preset.type} value={preset.type}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-orange-800 dark:text-orange-200 leading-relaxed">
                      با انتخاب نوع تخلف از منوی فوق، متن رسمی پیش‌فرض در کادر شرح زیر جایگذاری می‌شود که می‌توانید پیش از ارسال آن را ویرایش یا تکمیل کنید. این معرفی‌نامه بلافاصله در کارتابل واحد «امور دانشجویی و تربیت بدنی» برای تشکیل جلسه شورای انضباطی ثبت خواهد شد.
                    </p>
                  </div>
                )}

                {/* عناوین آماده */}
                {presetTitles[mode].length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {presetTitles[mode].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTitle(preset)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان {mode === 'message' ? 'پیام' : mode === 'summons' ? 'علت فراخوانی' : 'اقدام'} *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان را وارد کنید یا از گزینه‌های آماده بالا انتخاب نمایید..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شرح کامل و جزئیات {mode === 'message' ? '*' : ''}
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیحات، مستندات مشاهده‌شده یا نکات لازم برای اطلاع دانشجو..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-teal-500"
                    required={mode === 'message'}
                  />
                </div>

                {mode !== 'message' && (
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={sendInboxMessage}
                        onChange={(e) => setSendInboxMessage(e.target.checked)}
                        className="w-4 h-4 accent-teal-600 cursor-pointer"
                      />
                      <span>ارسال همزمان پیام اطلاع‌رسانی به صندوق پیام دانشجویان مشمول</span>
                    </label>

                    {mode === 'warning' && (
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={alsoAddRoomWarning}
                          onChange={(e) => setAlsoAddRoomWarning(e.target.checked)}
                          className="w-4 h-4 accent-rose-600 cursor-pointer"
                        />
                        <span>ثبت در فهرست اخطارهای فعال اتاق</span>
                      </label>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>ثبت و ارسال نهایی</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    بستن
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
