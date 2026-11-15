import React, { useEffect, useMemo, useState } from 'react';
import {
  Dormitory,
  Room,
  VisitReport,
  VisitCleanlinessCondition,
  VisitFacilitiesCondition,
} from '../types';
import { Storage } from '../utils/storage';
import { exportVisitReportsToExcel, toEnglishDigits } from '../utils/excelUtils';
import {
  X,
  ClipboardCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Trash2,
  History,
  Plus,
} from 'lucide-react';

interface RoomVisitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dorms: Dormitory[];
  rooms: Room[];
  initialDormId?: string;
  initialRoomId?: string;
  initialView?: 'create' | 'list';
  actorId?: string;
  actorName: string;
  actorRole: 'supervisor' | 'admin';
  onDataChanged: () => void;
}

export const RoomVisitReportModal: React.FC<RoomVisitReportModalProps> = ({
  isOpen,
  onClose,
  dorms,
  rooms,
  initialDormId,
  initialRoomId,
  initialView = 'create',
  actorId,
  actorName,
  actorRole,
  onDataChanged,
}) => {
  const [tab, setTab] = useState<'create' | 'list'>(initialView);
  const [dormId, setDormId] = useState(initialDormId || dorms[0]?.id || '');
  const [scope, setScope] = useState<'dorm' | 'room'>(initialRoomId ? 'room' : 'dorm');
  const [roomId, setRoomId] = useState(initialRoomId || '');

  const nowDateFa = new Date().toLocaleDateString('fa-IR');
  const nowTimeFa = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  const [visitDate, setVisitDate] = useState(nowDateFa);
  const [visitTime, setVisitTime] = useState(nowTimeFa);
  const [cleanlinessCondition, setCleanlinessCondition] =
    useState<VisitCleanlinessCondition>('good');
  const [facilitiesCondition, setFacilitiesCondition] =
    useState<VisitFacilitiesCondition>('healthy');
  const [disciplineScore, setDisciplineScore] = useState('100');
  const [cleanlinessScore, setCleanlinessScore] = useState('100');
  const [applyScoresToRoom, setApplyScoresToRoom] = useState(true);
  const [residentPresenceSummary, setResidentPresenceSummary] = useState('');
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // فیلترهای تاریخچه
  const [filterDormId, setFilterDormId] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<'all' | 'dorm' | 'room'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTab(initialView);
    const resolvedDormId = initialDormId || dorms[0]?.id || '';
    setDormId(resolvedDormId);
    setScope(initialRoomId ? 'room' : 'dorm');
    setRoomId(initialRoomId || '');
    setVisitDate(new Date().toLocaleDateString('fa-IR'));
    setVisitTime(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
    setCleanlinessCondition('good');
    setFacilitiesCondition('healthy');

    const targetRoom = initialRoomId ? rooms.find((r) => r.id === initialRoomId) : undefined;
    setDisciplineScore(String(targetRoom?.disciplineScore ?? 100));
    setCleanlinessScore(String(targetRoom?.cleanlinessScore ?? 100));
    setApplyScoresToRoom(true);
    setResidentPresenceSummary('');
    setSummary('');
    setRecommendations('');
    setFeedback(null);
    setFilterDormId(initialDormId || 'all');
  }, [isOpen, initialDormId, initialRoomId, initialView]);

  const dormRooms = useMemo(
    () => rooms.filter((r) => r.dormId === dormId),
    [rooms, dormId]
  );

  const allReports: VisitReport[] = Storage.getVisitReports();

  const filteredReports = useMemo(() => {
    const q = toEnglishDigits(searchQuery.trim().toLowerCase());
    return allReports.filter((rep) => {
      if (dorms.length > 0 && !dorms.some((d) => d.id === rep.dormId)) return false;
      if (filterDormId !== 'all' && rep.dormId !== filterDormId) return false;
      if (filterScope !== 'all' && rep.scope !== filterScope) return false;
      if (q) {
        const hay = toEnglishDigits(
          `${rep.reportCode} ${rep.dormName} ${rep.roomNumber || ''} ${rep.inspectorName} ${rep.summary} ${rep.recommendations || ''}`
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allReports, dorms, filterDormId, filterScope, searchQuery]);

  if (!isOpen) return null;

  const handleRoomSelectionChange = (nextRoomId: string) => {
    setRoomId(nextRoomId);
    const r = rooms.find((rm) => rm.id === nextRoomId);
    if (r) {
      setDisciplineScore(String(r.disciplineScore ?? 100));
      setCleanlinessScore(String(r.cleanlinessScore ?? 100));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const selectedDorm = dorms.find((d) => d.id === dormId);
    const selectedRoom = scope === 'room' ? rooms.find((r) => r.id === roomId) : undefined;

    if (!selectedDorm) {
      setFeedback({ ok: false, msg: 'لطفاً سرا را انتخاب نمایید.' });
      return;
    }
    if (scope === 'room' && !selectedRoom) {
      setFeedback({ ok: false, msg: 'برای ثبت گزارش بازدید اتاق، انتخاب شماره اتاق الزامی است.' });
      return;
    }

    let parsedDiscipline: number | undefined;
    let parsedCleanliness: number | undefined;
    if (scope === 'room') {
      const d = Number(toEnglishDigits(disciplineScore));
      const c = Number(toEnglishDigits(cleanlinessScore));
      if (Number.isNaN(d) || d < 0 || d > 100 || Number.isNaN(c) || c < 0 || c > 100) {
        setFeedback({ ok: false, msg: 'نمرات انضباط و نظافت باید بین ۰ تا ۱۰۰ باشد.' });
        return;
      }
      parsedDiscipline = d;
      parsedCleanliness = c;
    }

    const res = Storage.addVisitReport(
      {
        dormId: selectedDorm.id,
        dormName: selectedDorm.name,
        roomId: selectedRoom?.id,
        roomNumber: selectedRoom?.roomNumber,
        scope,
        inspectorId: actorId,
        inspectorName: actorName,
        inspectorRole: actorRole,
        visitDate: visitDate.trim() || nowDateFa,
        visitTime: visitTime.trim() || nowTimeFa,
        cleanlinessCondition,
        facilitiesCondition,
        disciplineScore: parsedDiscipline,
        cleanlinessScore: parsedCleanliness,
        residentPresenceSummary,
        summary,
        recommendations,
      },
      applyScoresToRoom
    );

    if (!res.success) {
      setFeedback({ ok: false, msg: res.message });
      return;
    }

    setFeedback({ ok: true, msg: res.message });
    setSummary('');
    setRecommendations('');
    setResidentPresenceSummary('');
    onDataChanged();
  };

  const cleanBadgeMap: Record<VisitCleanlinessCondition, { label: string; cls: string }> = {
    excellent: { label: 'بسیار مطلوب', cls: 'bg-emerald-100 text-emerald-800' },
    good: { label: 'قابل قبول', cls: 'bg-teal-100 text-teal-800' },
    needs_attention: { label: 'نیازمند تذکر', cls: 'bg-amber-100 text-amber-800' },
    poor: { label: 'نامطلوب', cls: 'bg-rose-100 text-rose-800' },
  };

  const facBadgeMap: Record<VisitFacilitiesCondition, { label: string; cls: string }> = {
    healthy: { label: 'تأسیسات سالم', cls: 'bg-emerald-100 text-emerald-800' },
    minor_issue: { label: 'نقص جزئی', cls: 'bg-amber-100 text-amber-800' },
    urgent_repair: { label: 'نیازمند تعمیر فوری', cls: 'bg-rose-100 text-rose-800' },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 bg-gradient-to-l from-teal-800 via-teal-700 to-slate-900 text-white rounded-t-3xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-amber-300" />
            <div>
              <h3 className="font-black text-base sm:text-lg">
                سامانه ثبت و پیگیری گزارش بازدید سرپرستی (سراها و اتاق‌ها)
              </h3>
              <p className="text-xs text-teal-100 mt-0.5">
                ثبت گزارش بازدید میدانی سرپرست از وضعیت کلی سرا یا هر اتاق به تفکیک
              </p>
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
          {/* تب‌های داخل مدال */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setTab('create')}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                tab === 'create'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>ثبت گزارش بازدید جدید</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('list')}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                tab === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <History className="w-4 h-4" />
              <span>تاریخچه گزارش‌های بازدید ({filteredReports.length})</span>
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

          {tab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    انتخاب سرای دانشجویی *
                  </label>
                  <select
                    value={dormId}
                    onChange={(e) => {
                      setDormId(e.target.value);
                      setRoomId('');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
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
                    محدوده بازدید *
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as 'dorm' | 'room')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="dorm">بازدید کلی سرا / راهروها / مشاعات</option>
                    <option value="room">بازدید اختصاصی یک اتاق مشخص</option>
                  </select>
                </div>

                {scope === 'room' ? (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      انتخاب اتاق *
                    </label>
                    <select
                      value={roomId}
                      onChange={(e) => handleRoomSelectionChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      required
                    >
                      <option value="">-- انتخاب شماره اتاق --</option>
                      {dormRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          اتاق {r.roomNumber} (طبقه {r.floor})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-end">
                    <div className="w-full px-3 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 font-semibold">
                      گزارش بازدید کلی سرای انتخاب‌شده
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ بازدید *
                  </label>
                  <input
                    type="text"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ساعت بازدید *
                  </label>
                  <input
                    type="text"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وضعیت نظافت و بهداشت
                  </label>
                  <select
                    value={cleanlinessCondition}
                    onChange={(e) => setCleanlinessCondition(e.target.value as VisitCleanlinessCondition)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="excellent">بسیار مطلوب و آراسته</option>
                    <option value="good">قابل قبول</option>
                    <option value="needs_attention">نیازمند تذکر و اصلاح</option>
                    <option value="poor">نامطلوب</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وضعیت تأسیسات و تجهیزات
                  </label>
                  <select
                    value={facilitiesCondition}
                    onChange={(e) => setFacilitiesCondition(e.target.value as VisitFacilitiesCondition)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="healthy">سالم و بدون نقص</option>
                    <option value="minor_issue">دارای نقص جزئی</option>
                    <option value="urgent_repair">نیازمند تعمیر فوری</option>
                  </select>
                </div>
              </div>

              {scope === 'room' && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                        نمره انضباط و رعایت مقررات سکونت و رفت و آمد (۰ تا ۱۰۰)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={disciplineScore}
                        onChange={(e) => setDisciplineScore(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                        نمره رعایت نظافت فردی و اجتماعی اتاق (۰ تا ۱۰۰)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={cleanlinessScore}
                        onChange={(e) => setCleanlinessScore(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyScoresToRoom}
                      onChange={(e) => setApplyScoresToRoom(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                    <span>بروزرسانی نمرات فعلی اتاق با نمرات ثبت‌شده در این بازدید</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وضعیت حضور ساکنین هنگام بازدید (اختیاری)
                </label>
                <input
                  type="text"
                  value={residentPresenceSummary}
                  onChange={(e) => setResidentPresenceSummary(e.target.value)}
                  placeholder="مثلاً حضور کامل ساکنین / ۱ نفر در مرخصی..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شرح کامل مشاهدات و گزارش بازدید *
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="گزارش وضعیت نظم، بهداشت، رعایت مقررات سکونت، وضعیت اموال و مشاهدات سرپرست در بازدید..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توصیه‌ها، تذکرات یا پیگیری‌های بعدی (اختیاری)
                </label>
                <input
                  type="text"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="مثلاً نیاز به بازدید مجدد، تعمیر شیر روشویی، تشویق بابت نظافت عالی..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>ثبت نهایی گزارش بازدید</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجو در گزارش‌ها (کد، اتاق، سرپرست، متن)..."
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <select
                    value={filterDormId}
                    onChange={(e) => setFilterDormId(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="all">همه سراها</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterScope}
                    onChange={(e) => setFilterScope(e.target.value as 'all' | 'dorm' | 'room')}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="all">کل سرا + اتاق‌ها</option>
                    <option value="dorm">فقط بازدید کل سرا</option>
                    <option value="room">فقط بازدید اتاق‌ها</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => exportVisitReportsToExcel(filteredReports)}
                  disabled={filteredReports.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>خروجی اکسل ({filteredReports.length})</span>
                </button>
              </div>

              {filteredReports.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  هیچ گزارش بازدیدی ثبت نشده است.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-[11px]">
                            {rep.reportCode}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-teal-600" />
                            <span>
                              {rep.dormName}
                              {rep.scope === 'room' ? ` — اتاق ${rep.roomNumber}` : ' (بازدید کلی سرا)'}
                            </span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${cleanBadgeMap[rep.cleanlinessCondition].cls}`}>
                            نظافت: {cleanBadgeMap[rep.cleanlinessCondition].label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${facBadgeMap[rep.facilitiesCondition].cls}`}>
                            {facBadgeMap[rep.facilitiesCondition].label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>
                            {rep.visitDate} ({rep.visitTime})
                          </span>
                          {confirmDeleteId === rep.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  Storage.deleteVisitReport(rep.id);
                                  setConfirmDeleteId(null);
                                  onDataChanged();
                                }}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold cursor-pointer"
                              >
                                حذف شود
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold cursor-pointer"
                              >
                                لغو
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(rep.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="حذف گزارش بازدید"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {(typeof rep.disciplineScore === 'number' || typeof rep.cleanlinessScore === 'number') && (
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {typeof rep.disciplineScore === 'number' && (
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 font-bold">
                              نمره انضباط و مقررات سکونت: {rep.disciplineScore}/۱۰۰
                            </span>
                          )}
                          {typeof rep.cleanlinessScore === 'number' && (
                            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200 font-bold">
                              نمره نظافت فردی و اجتماعی: {rep.cleanlinessScore}/۱۰۰
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{rep.summary}</p>
                      {rep.residentPresenceSummary && (
                        <div className="text-[11px] text-slate-500">
                          <strong>وضعیت حضور:</strong> {rep.residentPresenceSummary}
                        </div>
                      )}
                      {rep.recommendations && (
                        <div className="text-[11px] text-amber-800 dark:text-amber-300">
                          <strong>توصیه و پیگیری:</strong> {rep.recommendations}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">
                        بازدیدکننده: {rep.inspectorName} • ثبت: {rep.createdAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
