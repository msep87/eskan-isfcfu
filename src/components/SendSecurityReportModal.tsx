import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { PersianDatePicker } from './PersianDatePicker';
import {
  X,
  ShieldAlert,
  Search,
  Users,
  CheckCircle2,
  Building2,
  MapPin,
  Calendar,
  Send,
  AlertTriangle,
  UserPlus,
  Trash2,
} from 'lucide-react';
import {
  Dormitory,
  Room,
  SecurityReport,
  SecurityReportCategory,
  SecurityReportSeverity,
  Student,
} from '../types';
import { SECURITY_REPORT_PRESETS, Storage } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import { isStudentDormResident } from '../utils/financeUtils';

interface SendSecurityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterRole: 'supervisor' | 'admin' | 'maintenance' | 'student_affairs' | 'vice_dean';
  reporterId: string;
  reporterName: string;
  students?: Student[];
  dorms?: Dormitory[];
  rooms?: Room[];
  initialStudents?: Student[];
  defaultDormId?: string;
  defaultRoomNumber?: string;
  onSuccess?: (message: string, report?: SecurityReport) => void;
}

const ROLE_TITLES: Record<SendSecurityReportModalProps['reporterRole'], string> = {
  supervisor: 'سرپرست سرا',
  admin: 'مدیریت کل سامانه',
  maintenance: 'واحد تأسیسات و فنی',
  student_affairs: 'اداره امور دانشجویی',
  vice_dean: 'معاونت دانشجویی',
};

export const SendSecurityReportModal: React.FC<SendSecurityReportModalProps> = ({
  isOpen,
  onClose,
  reporterRole,
  reporterId,
  reporterName,
  students: propStudents,
  dorms: propDorms,
  rooms: propRooms,
  initialStudents,
  defaultDormId,
  defaultRoomNumber,
  onSuccess,
}) => {
  const allStudents = useMemo(
    () => (propStudents && propStudents.length > 0 ? propStudents : Storage.getStudents()),
    [propStudents, isOpen]
  );
  const allDorms = useMemo(
    () => (propDorms && propDorms.length > 0 ? propDorms : Storage.getDormitories()),
    [propDorms, isOpen]
  );
  const allRooms = useMemo(
    () => (propRooms && propRooms.length > 0 ? propRooms : Storage.getRooms()),
    [propRooms, isOpen]
  );

  const dormMap = useMemo(() => new Map(allDorms.map((d) => [d.id, d.name])), [allDorms]);
  const roomMap = useMemo(() => new Map(allRooms.map((r) => [r.id, r.roomNumber])), [allRooms]);

  const [reportScope, setReportScope] = useState<'student' | 'facility_campus'>('student');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [dormFilter, setDormFilter] = useState<string>(defaultDormId || 'all');
  const [roomQuickSelectId, setRoomQuickSelectId] = useState<string>('');

  const [category, setCategory] = useState<SecurityReportCategory>('disciplinary_incident');
  const [title, setTitle] = useState(SECURITY_REPORT_PRESETS[0].defaultTitle);
  const [severity, setSeverity] = useState<SecurityReportSeverity>('important');
  const [reportDormId, setReportDormId] = useState<string>(defaultDormId || '');
  const [reportRoomNumber, setReportRoomNumber] = useState<string>(defaultRoomNumber || '');
  const [locationDetails, setLocationDetails] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<string>(new Date().toLocaleDateString('fa-IR'));
  const [description, setDescription] = useState<string>(SECURITY_REPORT_PRESETS[0].defaultDescription);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const initIds = (initialStudents || []).map((s) => s.studentId);
    setReportScope('student');
    setSelectedStudentIds(initIds);
    setSearchQuery('');
    setDormFilter(defaultDormId || 'all');
    setRoomQuickSelectId('');
    setCategory('disciplinary_incident');
    setTitle(SECURITY_REPORT_PRESETS[0].defaultTitle);
    setSeverity('important');
    setReportDormId(defaultDormId || initialStudents?.[0]?.assignedDormId || '');
    setReportRoomNumber(
      defaultRoomNumber ||
        (initialStudents?.[0]?.assignedRoomId
          ? roomMap.get(initialStudents[0].assignedRoomId) || ''
          : initialStudents?.[0]?.assignedRoomNumber || '')
    );
    setLocationDetails('');
    setIncidentDate(new Date().toLocaleDateString('fa-IR'));
    setDescription(SECURITY_REPORT_PRESETS[0].defaultDescription);
    setErrorMsg('');
  }, [isOpen, initialStudents, defaultDormId, defaultRoomNumber, roomMap]);

  const studentById = useMemo(() => new Map(allStudents.map((s) => [s.studentId, s])), [allStudents]);

  const selectedStudents = useMemo(
    () =>
      selectedStudentIds
        .map((id) => studentById.get(id))
        .filter((s): s is Student => Boolean(s)),
    [selectedStudentIds, studentById]
  );

  const filteredRoomsForQuickSelect = useMemo(() => {
    if (dormFilter === 'all') return allRooms.slice(0, 120);
    return allRooms.filter((r) => r.dormId === dormFilter);
  }, [allRooms, dormFilter]);

  const filteredStudents = useMemo(() => {
    const q = toEnglishDigits(deferredSearch.trim().toLowerCase());
    return allStudents.filter((s) => {
      if (dormFilter === 'commuter') {
        if (isStudentDormResident(s)) return false;
      } else if (dormFilter !== 'all') {
        if (s.assignedDormId !== dormFilter) return false;
      }
      if (!q) return true;
      const roomNum = s.assignedRoomId ? roomMap.get(s.assignedRoomId) || '' : s.assignedRoomNumber || '';
      const dormName = s.assignedDormId ? dormMap.get(s.assignedDormId) || '' : s.assignedDormName || '';
      const hay = toEnglishDigits(
        `${s.fullName} ${s.studentId} ${s.nationalId} ${s.fieldOfStudy} ${roomNum} ${dormName}`
      ).toLowerCase();
      return hay.includes(q);
    });
  }, [allStudents, dormFilter, deferredSearch, dormMap, roomMap]);

  const visibleStudents = useMemo(() => filteredStudents.slice(0, 45), [filteredStudents]);

  if (!isOpen) return null;

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
    setErrorMsg('');
  };

  const handleSelectRoomResidents = (rId: string) => {
    setRoomQuickSelectId(rId);
    if (!rId) return;
    const targetRoom = allRooms.find((r) => r.id === rId);
    const residents = allStudents.filter((s) => s.assignedRoomId === rId && s.assignmentStatus !== 'none');
    if (residents.length === 0) {
      setErrorMsg('دانشجوی ساکنی در اتاق انتخاب‌شده یافت نشد.');
      return;
    }
    setSelectedStudentIds((prev) => {
      const set = new Set(prev);
      residents.forEach((r) => set.add(r.studentId));
      return Array.from(set);
    });
    if (targetRoom) {
      setReportDormId(targetRoom.dormId);
      setReportRoomNumber(targetRoom.roomNumber);
    }
    setErrorMsg('');
  };

  const handleCategoryChange = (nextCat: SecurityReportCategory) => {
    setCategory(nextCat);
    const preset = SECURITY_REPORT_PRESETS.find((p) => p.category === nextCat);
    if (preset) {
      setTitle(preset.defaultTitle);
      if (preset.defaultDescription) {
        setDescription(preset.defaultDescription);
      }
    }
  };

  const handleScopeChange = (nextScope: 'student' | 'facility_campus') => {
    setReportScope(nextScope);
    setErrorMsg('');
    if (nextScope === 'facility_campus' && category === 'disciplinary_incident') {
      const campusPreset = SECURITY_REPORT_PRESETS.find((p) => p.category === 'campus_dorm_environment');
      if (campusPreset) {
        setCategory(campusPreset.category);
        setTitle(campusPreset.defaultTitle);
        setDescription(campusPreset.defaultDescription);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (reportScope === 'student' && selectedStudents.length === 0) {
      setErrorMsg(
        'لطفاً حداقل یک دانشجو را انتخاب کنید یا اگر گزارش مربوط به خود سرا یا محوطه است، گزینه «مربوط به سراها و محوطه (بدون دانشجو)» را انتخاب نمایید.'
      );
      return;
    }
    if (
      reportScope === 'facility_campus' &&
      !reportDormId &&
      !locationDetails.trim() &&
      !reportRoomNumber.trim()
    ) {
      setErrorMsg('برای گزارش سرا یا محوطه، لطفاً سرای محل وقوع یا محل دقیق در محوطه را مشخص کنید.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('عنوان گزارش نمی‌تواند خالی باشد.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('شرح کامل واقعه یا گزارش الزامی است.');
      return;
    }

    const dormObj = allDorms.find((d) => d.id === reportDormId);
    const res = Storage.createSecurityReport({
      reportScope,
      students: reportScope === 'facility_campus' ? [] : selectedStudents,
      title,
      category,
      severity,
      dormId: reportDormId || undefined,
      dormName: dormObj?.name,
      roomNumber: reportRoomNumber.trim() || undefined,
      locationDetails: locationDetails.trim() || undefined,
      incidentDate: incidentDate.trim() || undefined,
      description,
      reportedById: reporterId,
      reportedByName: reporterName,
      reportedByRole: reporterRole,
    });

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    onSuccess?.(res.message, res.report);
    onClose();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* سربرگ */}
        <div className="bg-gradient-to-l from-slate-900 via-rose-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-rose-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base truncate">
                ارسال گزارش رسمی به واحد حراست و انتظامات
              </h3>
              <p className="text-[11px] text-slate-300 truncate">
                ثبت‌کننده: {reporterName} ({ROLE_TITLES[reporterRole]}) — گزارش دانشجویی یا گزارش سرا و محوطه
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/75 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* بدنه فرم */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* انتخاب نوع گزارش: مرتبط با دانشجو یا مربوط به خود سراها و محوطه */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleScopeChange('student')}
              className={`p-3.5 rounded-2xl border-2 text-right transition flex items-start gap-3 cursor-pointer ${
                reportScope === 'student'
                  ? 'bg-rose-50/80 dark:bg-rose-950/35 border-rose-500 text-rose-950 dark:text-rose-100 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  reportScope === 'student'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs sm:text-sm">گزارش مرتبط با دانشجو(یان)</div>
                <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                  انتخاب یک یا چند دانشجو یا کل ساکنین یک اتاق برای پیگیری حراست
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleScopeChange('facility_campus')}
              className={`p-3.5 rounded-2xl border-2 text-right transition flex items-start gap-3 cursor-pointer ${
                reportScope === 'facility_campus'
                  ? 'bg-amber-50/90 dark:bg-amber-950/35 border-amber-500 text-amber-950 dark:text-amber-100 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  reportScope === 'facility_campus'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs sm:text-sm">
                  مربوط به سراها، ساختمان یا محوطه (بدون دانشجو)
                </div>
                <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                  گزارش مسائل حفاظتی، ایمنی، دوربین، ورودی، مشاعات یا محوطه بدون نیاز به انتخاب دانشجو
                </p>
              </div>
            </button>
          </div>

          {/* بخش ۱: انتخاب یک یا چند دانشجو (فقط در حالت گزارش دانشجویی) */}
          {reportScope === 'student' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                  ۱. انتخاب دانشجو یا دانشجویان مرتبط با گزارش
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-rose-700 dark:text-rose-300 tabular-nums">
                  انتخاب‌شده: {selectedStudents.length.toLocaleString('fa-IR')} نفر
                </span>
                {selectedStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds([])}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>پاک کردن همه</span>
                  </button>
                )}
              </div>
            </div>

            {/* چیپ‌های دانشجویان انتخاب‌شده */}
            {selectedStudents.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-28 overflow-y-auto">
                {selectedStudents.map((st) => {
                  const rNum = st.assignedRoomId ? roomMap.get(st.assignedRoomId) : st.assignedRoomNumber;
                  return (
                    <button
                      key={st.studentId}
                      type="button"
                      onClick={() => toggleStudent(st.studentId)}
                      title="کلیک جهت حذف از لیست"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] font-bold transition cursor-pointer"
                    >
                      <span>{st.fullName}</span>
                      <span className="text-[10px] opacity-75 font-mono">({st.studentId})</span>
                      {rNum && <span className="text-[10px] opacity-75">· اتاق {rNum}</span>}
                      <X className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* ابزار جستجو و فیلتر دانشجو */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative sm:col-span-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو نام، شماره دانشجویی، کد ملی، اتاق..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <select
                value={dormFilter}
                onChange={(e) => {
                  setDormFilter(e.target.value);
                  setRoomQuickSelectId('');
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">همه دانشجویان ({allStudents.length.toLocaleString('fa-IR')})</option>
                {allDorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    سرای {d.name}
                  </option>
                ))}
                <option value="commuter">دانشجویان ترددی / فاقد اتاق</option>
              </select>

              <select
                value={roomQuickSelectId}
                onChange={(e) => handleSelectRoomResidents(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              >
                <option value="">افزودن کل ساکنین یک اتاق...</option>
                {filteredRoomsForQuickSelect.map((r) => (
                  <option key={r.id} value={r.id}>
                    اتاق {r.roomNumber} ({dormMap.get(r.dormId) || 'سرا'})
                  </option>
                ))}
              </select>
            </div>

            {/* فهرست دانشجویان قابل تیک زدن */}
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {visibleStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  دانشجویی با این مشخصات یافت نشد.
                </div>
              ) : (
                visibleStudents.map((st) => {
                  const isSelected = selectedStudentIds.includes(st.studentId);
                  const dName = st.assignedDormId ? dormMap.get(st.assignedDormId) : st.assignedDormName;
                  const rNum = st.assignedRoomId ? roomMap.get(st.assignedRoomId) : st.assignedRoomNumber;
                  return (
                    <button
                      key={st.studentId}
                      type="button"
                      onClick={() => toggleStudent(st.studentId)}
                      className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-right text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold truncate">
                            {st.fullName}{' '}
                            <span className="font-mono text-[11px] opacity-70">({st.studentId})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {st.fieldOfStudy || 'رشته نامشخص'} · کدملی: {st.nationalId || '-'}
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 text-left">
                        {dName
                          ? `${dName}${rNum ? ` · اتاق ${rNum}` : ''}`
                          : isStudentDormResident(st)
                          ? 'خوابگاهی (بدون اتاق)'
                          : 'ترددی / بدون اتاق'}
                      </div>
                    </button>
                  );
                })
              )}
              {filteredStudents.length > visibleStudents.length && (
                <div className="px-3 py-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 text-center">
                  نمایش {visibleStudents.length} از {filteredStudents.length.toLocaleString('fa-IR')} نتیجه — برای دسترسی دقیق‌تر نام یا شماره دانشجویی را جستجو کنید.
                </div>
              )}
            </div>
          </div>
          )}

          {/* بخش ۲: جزئیات و متن گزارش */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                دسته‌بندی موضوع گزارش (انتخاب قالب آماده)
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as SecurityReportCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              >
                {SECURITY_REPORT_PRESETS.map((p) => (
                  <option key={p.category} value={p.category}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                درجه فوریت و اهمیت گزارش
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: 'normal', label: 'عادی', activeCls: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' },
                  { id: 'important', label: 'مهم', activeCls: 'bg-amber-600 text-white shadow-xs' },
                  { id: 'urgent', label: 'فوری / اضطراری', activeCls: 'bg-rose-600 text-white shadow-xs' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSeverity(opt.id as SecurityReportSeverity)}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                      severity === opt.id
                        ? opt.activeCls
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان گزارش *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="عنوان دقیق گزارش برای حراست..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>سرای محل وقوع {reportScope === 'facility_campus' ? '(یا محوطه کلی)' : ''}</span>
              </label>
              <select
                value={reportDormId}
                onChange={(e) => setReportDormId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="">
                  {reportScope === 'facility_campus'
                    ? 'محوطه عمومی / کل مجموعه سراها'
                    : 'تشخیص خودکار از پرونده دانشجو / عمومی'}
                </option>
                {allDorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره اتاق (اختیاری)
                </label>
                <input
                  type="text"
                  value={reportRoomNumber}
                  onChange={(e) => setReportRoomNumber(e.target.value)}
                  placeholder="مثلاً ۱۰۴"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>تاریخ وقوع</span>
                </label>
                <PersianDatePicker
                  value={incidentDate}
                  onChange={setIncidentDate}
                  placeholder="۱۴۰۵/۰۷/۱۵"
                  digits="fa"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  محل دقیق یا جزئیات مکانی{' '}
                  {reportScope === 'facility_campus' && !reportDormId ? '*' : '(اختیاری)'}
                </span>
              </label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="مثلاً ورودی اصلی سرا، محوطه و حیاط، راهروی طبقه دوم، نمازخانه، سلف، دوربین‌ها..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
              {reportScope === 'facility_campus' && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'محوطه و حیاط',
                    'ورودی اصلی و نگهبانی',
                    'راهروها و مشاعات',
                    'دوربین‌ها و روشنایی',
                    'تأسیسات و موتورخانه',
                    'سلف و آشپزخانه',
                    'پارکینگ و اطراف سرا',
                    'نمازخانه / سالن مطالعه',
                  ].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocationDetails(loc)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        locationDetails === loc
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                شرح دقیق گزارش، مشاهدات و مستندات برای واحد حراست *
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="شرح کامل واقعه، زمان دقیق، افراد حاضر، خسارات یا موارد نیازمند پیگیری حفاظتی را بنویسید..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white leading-relaxed"
              />
            </div>
          </div>

          {/* دکمه‌های پایین */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>
                {reportScope === 'facility_campus'
                  ? 'ثبت و ارسال گزارش سرا / محوطه به حراست'
                  : `ثبت و ارسال رسمی به حراست (${selectedStudents.length.toLocaleString('fa-IR')} دانشجو)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
