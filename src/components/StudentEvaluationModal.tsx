import React, { useState, useEffect, useMemo } from 'react';
import { Student, Dormitory, Room, StudentEvaluation } from '../types';
import { Storage } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import {
  X,
  Award,
  AlertTriangle,
  MessageSquareWarning,
  User,
  Building2,
  CheckCircle,
  Trash2,
  Search,
  Users,
  Sparkles,
} from 'lucide-react';

interface StudentEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  dorms: Dormitory[];
  rooms: Room[];
  initialStudent?: Student | null;
  evaluatorName: string;
  evaluatorRole: 'admin' | 'supervisor';
  onSaved: () => void;
}

export const StudentEvaluationModal: React.FC<StudentEvaluationModalProps> = ({
  isOpen,
  onClose,
  students,
  dorms,
  rooms,
  initialStudent,
  evaluatorName,
  evaluatorRole,
  onSaved,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [evalType, setEvalType] = useState<'evaluation' | 'notice' | 'warning'>('evaluation');
  const [scope, setScope] = useState<'individual' | 'room'>('individual');
  const [score, setScore] = useState<string>('100');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [applyToRoommates, setApplyToRoommates] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [evaluationsTick, setEvaluationsTick] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    if (initialStudent) {
      setSelectedStudentId(initialStudent.studentId);
      setScore(String(initialStudent.previousScore ?? 100));
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].studentId);
      setScore(String(students[0].previousScore ?? 100));
    }
    setStudentSearch('');
    setTitle('');
    setDescription('');
    setFeedback(null);
    setApplyToRoommates(false);
  }, [isOpen, initialStudent, students]);

  const filteredStudents = useMemo(() => {
    const q = toEnglishDigits(studentSearch.trim().toLowerCase());
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.fullName || '').toLowerCase().includes(q) ||
        toEnglishDigits(s.studentId || '').toLowerCase().includes(q) ||
        (s.fieldOfStudy || '').toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.studentId === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const studentDorm = useMemo(
    () => dorms.find((d) => d.id === selectedStudent?.assignedDormId) || null,
    [dorms, selectedStudent]
  );

  const studentRoom = useMemo(
    () => rooms.find((r) => r.id === selectedStudent?.assignedRoomId) || null,
    [rooms, selectedStudent]
  );

  const studentEvaluations = useMemo<StudentEvaluation[]>(() => {
    void evaluationsTick;
    if (!selectedStudent) return [];
    const all = Storage.getStudentEvaluations();
    return all.filter(
      (e) =>
        e.studentId === selectedStudent.studentId ||
        (e.scope === 'room' && selectedStudent.assignedRoomId && e.roomId === selectedStudent.assignedRoomId)
    );
  }, [selectedStudent, evaluationsTick, isOpen]);

  if (!isOpen) return null;

  const presets =
    evalType === 'evaluation'
      ? scope === 'individual'
        ? ['ارزیابی نظم و انضباط فردی', 'ارزیابی بهداشت و نظافت شخصی', 'ارزیابی تعامل و رعایت حقوق هم‌اتاقی‌ها', 'ارزیابی پایان‌ترم سرای دانشجویی']
        : ['ارزیابی نظافت و آراستگی اتاق', 'ارزیابی نظم و نگهداری اموال اتاق', 'بازرسی دوره‌ای بهداشت محیط اتاق']
      : evalType === 'notice'
      ? ['تذکر رعایت نظافت و بهداشت', 'تذکر رعایت ساعت خاموشی و آرامش', 'تذکر چیدمان و نظم وسایل شخصی', 'تذکر صرفه‌جویی در مصرف انرژی']
      : ['اخطار رسمی نقض مقررات انضباطی سرا', 'اخطار ایجاد مزاحمت و سر و صدا', 'اخطار آسیب به تجهیزات و اموال سرا', 'اخطار عدم حضور بدون هماهنگی'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedStudent) {
      setFeedback({ ok: false, msg: 'لطفاً ابتدا دانشجوی مورد نظر را انتخاب نمایید.' });
      return;
    }

    if (!title.trim()) {
      setFeedback({ ok: false, msg: 'لطفاً عنوان تذکر، اخطار یا ارزیابی را وارد نمایید.' });
      return;
    }

    let numericScore: number | undefined;
    if (evalType === 'evaluation') {
      const parsed = Number(toEnglishDigits(score.trim()));
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        setFeedback({ ok: false, msg: 'نمره ارزیابی باید عددی بین ۰ تا ۱۰۰ باشد.' });
        return;
      }
      numericScore = Math.round(parsed * 10) / 10;
    }

    const res = Storage.addStudentEvaluation(
      {
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.fullName,
        dormId: studentDorm?.id || selectedStudent.assignedDormId,
        dormName: studentDorm?.name,
        roomId: studentRoom?.id || selectedStudent.assignedRoomId,
        roomNumber: studentRoom?.roomNumber,
        type: evalType,
        scope,
        score: numericScore,
        title: title.trim(),
        description:
          description.trim() ||
          (evalType === 'evaluation'
            ? `نمره ارزیابی ${scope === 'room' ? 'اتاق' : 'فردی'}: ${numericScore} از ۱۰۰`
            : title.trim()),
        evaluatorName,
        evaluatorRole,
      },
      scope === 'room' && applyToRoommates
    );

    setFeedback({ ok: res.success, msg: res.message });
    setTitle('');
    setDescription('');
    setEvaluationsTick((t) => t + 1);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* هدر مودال */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              ثبت تذکر، اخطار و نمره ارزیابی فردی / اتاق دانشجو
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ثبت‌کننده: <span className="font-bold text-slate-700 dark:text-slate-300">{evaluatorName}</span> • قابل مشاهده در پنل دانشجو
            </p>
          </div>
        </div>

        {/* انتخاب دانشجو */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="جستجوی دانشجو با نام، شماره دانشجویی یا رشته..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                const sid = e.target.value;
                setSelectedStudentId(sid);
                const st = students.find((s) => s.studentId === sid);
                if (st && st.previousScore !== undefined) {
                  setScore(String(st.previousScore));
                }
              }}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {filteredStudents.length === 0 ? (
                <option value="">دانشجویی یافت نشد</option>
              ) : (
                filteredStudents.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.fullName} ({s.studentId}) - {s.fieldOfStudy}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedStudent && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200">
                <User className="w-3.5 h-3.5 text-teal-600" />
                {selectedStudent.fullName} ({selectedStudent.studentId})
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                {studentDorm ? `${studentDorm.name} • اتاق ${studentRoom?.roomNumber || '-'}` : 'فاقد اتاق تخصیص‌یافته'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-extrabold text-emerald-700 dark:text-emerald-300">
                <Award className="w-3.5 h-3.5" />
                نمره فعلی: {selectedStudent.previousScore ?? 100}
              </span>
            </div>
          )}
        </div>

        {/* فرم ثبت */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                feedback.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* انتخاب نوع اقدام */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نوع ثبت
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setEvalType('evaluation')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    evalType === 'evaluation'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>نمره ارزیابی</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEvalType('notice')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    evalType === 'notice'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <MessageSquareWarning className="w-3.5 h-3.5" />
                  <span>تذکر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEvalType('warning')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    evalType === 'warning'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>اخطار رسمی</span>
                </button>
              </div>
            </div>

            {/* انتخاب گستره: فردی یا اتاق */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                گستره ارزیابی / تذکر
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setScope('individual')}
                  className={`py-2 px-3 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    scope === 'individual'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>فردی (شخص دانشجو)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope('room')}
                  className={`py-2 px-3 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    scope === 'room'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>اتاق (وضعیت اتاق)</span>
                </button>
              </div>
            </div>
          </div>

          {scope === 'room' && studentRoom && (
            <label className="flex items-center gap-2 text-xs text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 px-3.5 py-2.5 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={applyToRoommates}
                onChange={(e) => setApplyToRoommates(e.target.checked)}
                className="rounded border-teal-400 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="font-bold">
                ثبت همزمان این مورد در پرونده تمامی هم‌اتاقی‌های ساکن در اتاق {studentRoom.roomNumber}
              </span>
            </label>
          )}

          {/* فیلد نمره برای ارزیابی */}
          {evalType === 'evaluation' && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                  نمره ارزیابی {scope === 'room' ? 'اتاق' : 'فردی'} (از ۰ تا ۱۰۰):
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[100, 95, 90, 80, 70, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setScore(String(val))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        Number(toEnglishDigits(score)) === val
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full sm:w-48 px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-sm font-black text-center dir-ltr focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
                required
              />
            </div>
          )}

          {/* عناوین آماده */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>عناوین آماده (با کلیک پر می‌شود):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTitle(p)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              عنوان {evalType === 'evaluation' ? 'ارزیابی' : evalType === 'notice' ? 'تذکر' : 'اخطار'} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: ارزیابی نظم و بهداشت یا تذکر رعایت آرامش"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              شرح و جزئیات (اختیاری)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات تکمیلی جهت مشاهده دانشجو در پنل شخصی..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              بستن
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition cursor-pointer ${
                evalType === 'evaluation'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : evalType === 'notice'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {evalType === 'evaluation'
                ? 'ثبت نمره ارزیابی دانشجو'
                : evalType === 'notice'
                ? 'ثبت تذکر برای دانشجو'
                : 'ثبت اخطار رسمی برای دانشجو'}
            </button>
          </div>
        </form>

        {/* سوابق قبلی دانشجو */}
        {selectedStudent && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-3">
              سوابق تذکر، اخطار و ارزیابی‌های ثبت‌شده برای {selectedStudent.fullName} ({studentEvaluations.length} مورد)
            </h4>
            {studentEvaluations.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                تاکنون تذکر، اخطار یا نمره ارزیابی برای این دانشجو ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {studentEvaluations.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                      ev.type === 'evaluation'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                        : ev.type === 'warning'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                            ev.type === 'evaluation'
                              ? 'bg-emerald-600 text-white'
                              : ev.type === 'warning'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {ev.type === 'evaluation'
                            ? `نمره: ${ev.score ?? '-'}`
                            : ev.type === 'warning'
                            ? 'اخطار رسمی'
                            : 'تذکر'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {ev.scope === 'room' ? 'ارزیابی/تذکر اتاق' : 'فردی'}
                        </span>
                        <span className="font-extrabold text-slate-800 dark:text-white">{ev.title}</span>
                        {ev.type !== 'evaluation' && (
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              ev.resolved
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                            }`}
                          >
                            {ev.resolved ? 'برطرف شده' : 'فعال'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{ev.description}</p>
                      <div className="text-[10px] text-slate-400">
                        ثبت‌کننده: {ev.evaluatorName} • تاریخ: {ev.date}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {ev.type !== 'evaluation' && !ev.resolved && (
                        <button
                          type="button"
                          onClick={() => {
                            Storage.resolveStudentEvaluation(ev.id);
                            setEvaluationsTick((t) => t + 1);
                            onSaved();
                          }}
                          className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition cursor-pointer"
                          title="ثبت به عنوان رفع‌شده"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          Storage.deleteStudentEvaluation(ev.id);
                          setEvaluationsTick((t) => t + 1);
                          onSaved();
                        }}
                        className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition cursor-pointer"
                        title="حذف سابقه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
