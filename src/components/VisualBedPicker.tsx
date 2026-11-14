import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Dormitory, Room, Bed, Student, AppSettings } from '../types';
import { Storage } from '../utils/storage';
import {
  Bed as BedIcon,
  CheckCircle,
  AlertTriangle,
  Lock,
  ArrowUpDown,
  User,
  Users,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Check,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { StudentRoomProfileModal } from './StudentRoomProfileModal';

interface VisualBedPickerProps {
  student?: Student; // در صورتی که دانشجو در حال انتخاب است
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  settings: AppSettings;
  onBedSelected: () => void;
  isSupervisorMode?: boolean;
  actorName?: string;
  actorRole?: 'admin' | 'supervisor';
  actorId?: string;
}

export const VisualBedPicker: React.FC<VisualBedPickerProps> = ({
  student,
  dorms,
  rooms,
  beds,
  students,
  settings,
  onBedSelected,
  isSupervisorMode = false,
  actorName = 'سرپرست / مدیر سرا',
  actorRole = 'supervisor',
  actorId,
}) => {
  const [selectedDormId, setSelectedDormId] = useState<string>(
    student?.assignedDormId || dorms[0]?.id || ''
  );

  useEffect(() => {
    if (dorms.length > 0 && (!selectedDormId || !dorms.some((d) => d.id === selectedDormId))) {
      setSelectedDormId(student?.assignedDormId || dorms[0].id);
    }
  }, [dorms, selectedDormId, student?.assignedDormId]);
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [filterVacantOnly, setFilterVacantOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // مدال تأیید انتخاب تخت
  const [confirmModalData, setConfirmModalData] = useState<{
    bed: Bed;
    room: Room;
    dorm: Dormitory;
    roommates: { bed: Bed; occupant?: Student }[];
  } | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedOccupantModal, setSelectedOccupantModal] = useState<{
    student: Student;
    room: Room;
    bed: Bed;
  } | null>(null);

  const currentDorm = dorms.find((d) => d.id === selectedDormId) || dorms[0];

  // فیلتر کردن اتاق‌ها
  const dormRooms = rooms.filter((r) => r.dormId === selectedDormId);
  const filteredRooms = dormRooms.filter((room) => {
    if (selectedFloor !== 'all' && room.floor !== selectedFloor) return false;

    const roomBeds = beds.filter((b) => b.roomId === room.id);
    const vacantCount = roomBeds.filter((b) => !b.studentId).length;

    if (filterVacantOnly && vacantCount === 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      const matchesNum = room.roomNumber.includes(q);
      const matchesField = room.allowedFields?.some((f) => f.includes(q));
      if (!matchesNum && !matchesField) return false;
    }

    return true;
  });

  // چک کردن مجاز بودن دانشجو برای این اتاق
  const checkEligibility = (room: Room): { eligible: boolean; reason?: string } => {
    if (isSupervisorMode || !student) return { eligible: true };

    // بررسی تکمیل بودن پرونده
    if (!student.isProfileCompleted) {
      return {
        eligible: false,
        reason: 'پرونده شما هنوز تکمیل نشده است. لطفاً ابتدا اطلاعات پرونده خود را ثبت و تأیید فرمایید.',
      };
    }

    // بررسی جنسیت پردیس
    if (currentDorm?.gender === 'brothers' && (student.fullName || '').includes('خانم')) {
      // نرمال‌سازی ساده
    }

    // بررسی سهمیه رشته
    if (room.allowedFields && room.allowedFields.length > 0) {
      const stField = student.fieldOfStudy || '';
      const match = room.allowedFields.some(
        (f) => stField.includes(f) || (stField && f.includes(stField))
      );
      if (!match) {
        return {
          eligible: false,
          reason: `این اتاق ویژه رشته‌های [${room.allowedFields.join('، ')}] است و با رشته شما (${stField || 'نامشخص'}) مطابقت ندارد.`,
        };
      }
    }

    // بررسی سهمیه ورودی
    if (room.allowedEntryTerms && room.allowedEntryTerms.length > 0) {
      if (!room.allowedEntryTerms.includes(student.entryTerm)) {
        return {
          eligible: false,
          reason: `این اتاق ویژه ورودی‌های [${room.allowedEntryTerms.join('، ')}] است (ورودی شما: ${student.entryTerm}).`,
        };
      }
    }

    return { eligible: true };
  };

  const handleBedClick = (bed: Bed, room: Room) => {
    // اگر در حالت دانشجویی است و پرونده تکمیل نشده است
    if (!isSupervisorMode && student && !student.isProfileCompleted) {
      setNotification({
        type: 'error',
        message: 'جهت انتخاب تخت، ابتدا باید اطلاعات پرونده خود را تکمیل و تأیید فرمایید.',
      });
      return;
    }

    // اگر در حالت دانشجویی است و زمان انتخاب فعال نیست
    if (!isSupervisorMode && !settings.selectionActive) {
      setNotification({
        type: 'error',
        message: 'مهلت انتخاب اتاق در حال حاضر غیرفعال است یا به پایان رسیده است.',
      });
      return;
    }

    // اگر تخت پر است
    if (bed.studentId) {
      const occupant = students.find((s) => s.studentId === bed.studentId);
      if (isSupervisorMode && occupant) {
        setSelectedOccupantModal({ student: occupant, room, bed });
        return;
      }
      if (bed.studentId === student?.studentId) {
        setNotification({
          type: 'success',
          message: 'این تخت در حال حاضر متعلق به شماست.',
        });
      } else {
        setNotification({
          type: 'error',
          message: `این تخت توسط ${occupant?.fullName || 'دانشجوی دیگر'} انتخاب شده است.`,
        });
      }
      return;
    }

    // بررسی سهمیه
    const eligibility = checkEligibility(room);
    if (!eligibility.eligible) {
      setNotification({
        type: 'error',
        message: eligibility.reason || 'شما مجاز به انتخاب این اتاق نیستید.',
      });
      return;
    }

    // باز کردن مدال تأیید با نمایش هم‌اتاقی‌های فعلی این اتاق
    const roomBeds = beds.filter((b) => b.roomId === room.id);
    const roommates = roomBeds
      .filter((b) => b.id !== bed.id)
      .map((b) => ({
        bed: b,
        occupant: students.find((s) => s.studentId === b.studentId),
      }));

    if (!currentDorm) return;

    setConfirmModalData({
      bed,
      room,
      dorm: currentDorm,
      roommates,
    });
  };

  const confirmBedSelection = () => {
    if (!confirmModalData || !student) return;

    const result = Storage.assignBedToStudent(student.studentId, confirmModalData.bed.id, false);

    if (result.success) {
      // پرتاب شادی کنفتی
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#0d9488', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981'],
        });
      } catch (e) {
        // fallback
      }

      setNotification({ type: 'success', message: result.message });
      setConfirmModalData(null);
      onBedSelected();
    } else {
      setNotification({ type: 'error', message: result.message });
    }
  };

  // آمار کلی سرا
  const allDormBeds = beds.filter((b) => b.dormId === selectedDormId);
  const totalBeds = allDormBeds.length;
  const occupiedBeds = allDormBeds.filter((b) => b.studentId).length;
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* نوتیفیکیشن موقت */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* کارت سربرگ و راهنما */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <BedIcon className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                نقشه بصری و تعاملی سراها، اتاق‌ها و تخت‌ها
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              به صورت بصری و تعاملی، روی هر تخت خالی (سبز رنگ) کلیک نموده تا اتاق و تخت مورد نظر خود را رزرو و انتخاب فرمایید.
            </p>
          </div>

          {/* آمار ظرفیت سرا */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <span className="block text-[11px] text-slate-400">کل ظرفیت</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{totalBeds} تخت</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="block text-[11px] text-emerald-600 dark:text-emerald-400">تخت خالی</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{vacantBeds}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-center">
              <span className="block text-[11px] text-teal-600 dark:text-teal-400">درصد اشغال</span>
              <span className="text-sm font-bold text-teal-700 dark:text-teal-300">٪{occupancyPercent}</span>
            </div>
          </div>
        </div>

        {/* انتخاب سرا */}
        <div className="flex flex-wrap gap-2 pt-4">
          {dorms.map((dorm) => (
            <button
              key={dorm.id}
              onClick={() => {
                setSelectedDormId(dorm.id);
                setSelectedFloor('all');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                selectedDormId === dorm.id
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{dorm.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedDormId === dorm.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                {dorm.gender === 'brothers' ? 'برادران' : 'خواهران'}
              </span>
            </button>
          ))}
        </div>

        {/* ابزارهای فیلتر (طبقات، تخت‌های خالی، جستجو) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">طبقه:</span>
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedFloor === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              همه طبقات
            </button>
            {Array.from({ length: currentDorm?.totalFloors || 0 }).map((_, idx) => (
              <button
                key={idx + 1}
                onClick={() => setSelectedFloor(idx + 1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedFloor === idx + 1
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                طبقه {idx + 1}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filterVacantOnly}
                onChange={(e) => setFilterVacantOnly(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
              />
              <span>فقط اتاق‌های دارای تخت خالی</span>
            </label>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="شماره اتاق یا رشته..."
                className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* راهنمای رنگ‌های وضعیت تخت‌ها */}
        <div className="flex flex-wrap items-center gap-4 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-xs" />
            <span>تخت خالی (آماده انتخاب)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-blue-500 shadow-xs" />
            <span>اشغال شده توسط دانشجو</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-400 ring-2 ring-amber-500/50 shadow-xs" />
            <span>تخت انتخابی شما</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-300 dark:bg-slate-700" />
            <span>غیرمجاز (سهمیه رشته/ورودی دیگر)</span>
          </div>
        </div>

        {/* راهنمای شماره تخت‌ها (فرد=پایین | زوج=بالا) */}
        <div className="mt-4 p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold">
            <ArrowUpDown className="w-4 h-4 text-teal-600 shrink-0" />
            <span>قاعده چیدمان و شماره تخت‌ها:</span>
            <span className="font-normal text-teal-800 dark:text-teal-300">
              شماره‌های <strong className="font-black text-teal-950 dark:text-teal-100">فرد (۱، ۳، ۵، ۷، ...)</strong> طبقه پایین و شماره‌های <strong className="font-black text-teal-950 dark:text-teal-100">زوج (۲، ۴، ۶، ۸، ...)</strong> طبقه بالا می‌باشند.
            </span>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-xl bg-teal-200/60 dark:bg-teal-900 text-teal-900 dark:text-teal-100 font-black shrink-0 self-start sm:self-auto">
            اتاق ۸ نفره: ۱ و ۳ و ۵ و ۷ پایین | ۲ و ۴ و ۶ و ۸ بالا
          </span>
        </div>

      </div>

      {/* شبکه نمایش اتاق‌ها */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Filter className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">هیچ اتاقی با شرایط فیلتر انتخاب شده یافت نشد.</h3>
          <p className="text-xs text-slate-400 mt-1">لطفاً فیلتر طبقه یا جستجو را تغییر دهید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const roomBeds = beds.filter((b) => b.roomId === room.id);
            const vacantBedsInRoom = roomBeds.filter((b) => !b.studentId);
            const eligibility = checkEligibility(room);

            // گروه‌بندی تخت‌ها بر اساس شماره دوطبقه (تخت ۱: بالا و پایین)
            const bunkPairsMap = new Map<number, { lower?: Bed; upper?: Bed }>();
            roomBeds.forEach((b) => {
              const pair = bunkPairsMap.get(b.bunkNumber) || {};
              if (b.tier === 'lower') pair.lower = b;
              if (b.tier === 'upper') pair.upper = b;
              bunkPairsMap.set(b.bunkNumber, pair);
            });

            const hasCurrentStudentBed = roomBeds.some((b) => b.studentId === student?.studentId);

            return (
              <div
                key={room.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-md ${
                  hasCurrentStudentBed
                    ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20'
                    : !eligibility.eligible
                    ? 'border-slate-200 dark:border-slate-800 opacity-80'
                    : 'border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600'
                }`}
              >
                {/* بنر وضعیت شما در اتاق */}
                {hasCurrentStudentBed && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-400 text-slate-900 font-extrabold text-[10px] px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>اتاق فعلی شما</span>
                  </div>
                )}

                {/* سربرگ کارت اتاق */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        اتاق {room.roomNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        طبقه {room.floor === 0 ? 'همکف' : room.floor}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      ظرفیت: {room.capacity} نفر ({vacantBedsInRoom.length} تخت خالی)
                    </div>
                  </div>

                  {/* نماینده اتاق */}
                  {room.representativeStudentId && (
                    <div
                      className="px-2 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[10px] text-purple-700 dark:text-purple-300 font-bold"
                      title="این اتاق دارای نماینده تعیین‌شده توسط سرپرست است"
                    >
                      🌟 دارای نماینده
                    </div>
                  )}
                </div>

                {/* برچسب سهمیه رشته‌ها در صورت وجود */}
                {room.allowedFields && room.allowedFields.length > 0 && (
                  <div className="mb-3 p-2 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 text-[11px] text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                    <span>سهمیه: {room.allowedFields.join('، ')}</span>
                  </div>
                )}

                {!eligibility.eligible && (
                  <div className="mb-3 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{eligibility.reason}</span>
                  </div>
                )}

                {/* چیدمان بصری و انتخاب تخت‌های دوطبقه */}
                <div className="space-y-3 my-4">
                  {Array.from(bunkPairsMap.entries()).map(([bunkNum, pair]) => (
                    <div
                      key={bunkNum}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800"
                    >
                      <div className="text-[10px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                        <span>مجموعه تخت دوطبقه شماره {bunkNum}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">

                        {/* تخت طبقه بالا */}
                        {pair.upper && (
                          <BedUnit
                            bed={pair.upper}
                            tierLabel="طبقه بالا ⬆️"
                            currentStudentId={student?.studentId}
                            students={students}
                            isEligible={eligibility.eligible}
                            isSupervisorMode={isSupervisorMode}
                            onClick={() => handleBedClick(pair.upper!, room)}
                          />
                        )}

                        {/* تخت طبقه پایین */}
                        {pair.lower && (
                          <BedUnit
                            bed={pair.lower}
                            tierLabel="طبقه پایین ⬇️"
                            currentStudentId={student?.studentId}
                            students={students}
                            isEligible={eligibility.eligible}
                            isSupervisorMode={isSupervisorMode}
                            onClick={() => handleBedClick(pair.lower!, room)}
                          />
                        )}

                      </div>
                    </div>
                  ))}
                </div>

                {/* امکانات اتاق */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {room.facilities.map((fac, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      {fac}
                    </span>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* مدال تأیید انتخاب تخت با پیش‌نمایش هم‌اتاقی‌ها */}
      {confirmModalData && student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600">
                  <BedIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    تأیید نهایی انتخاب تخت
                  </h3>
                  <p className="text-xs text-slate-500">
                    {confirmModalData.dorm.name} - اتاق {confirmModalData.room.roomNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmModalData(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* مشخصات تخت انتخابی */}
            <div className="my-5 p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-700 dark:text-teal-300 font-semibold block">تخت انتخاب شده:</span>
                <span className="text-base font-extrabold text-teal-950 dark:text-teal-100">
                  {confirmModalData.bed.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  طبقه {confirmModalData.room.floor} - ظرفیت کل {confirmModalData.room.capacity} نفره
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                {confirmModalData.bed.bunkNumber}
              </div>
            </div>

            {/* نمایش هم‌اتاقی‌های فعلی در این اتاق */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
                <Users className="w-4 h-4 text-teal-600" />
                <span>هم‌اتاقی‌های شما در این اتاق ({confirmModalData.roommates.filter((r) => r.occupant).length} نفر ساکن):</span>
              </div>

              {confirmModalData.roommates.filter((r) => r.occupant).length === 0 ? (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 text-center">
                  این اتاق در حال حاضر کاملاً خالی است و شما اولین ساکن آن خواهید بود!
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {confirmModalData.roommates
                    .filter((r) => r.occupant)
                    .map((rm) => (
                      <div
                        key={rm.bed.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs"
                            style={{ backgroundColor: rm.occupant?.avatarColor || '#0d9488' }}
                          >
                            {rm.occupant?.fullName.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100">
                              {rm.occupant?.fullName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {rm.occupant?.fieldOfStudy} • ورودی {rm.occupant?.entryTerm} • {rm.occupant?.city}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                          {rm.bed.label}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* توضیح موقت بودن تخصیص اولیه */}
            <div className="mb-4 p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 text-xs text-teal-800 dark:text-teal-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-teal-600" />
              <span>
                توجه: این درخواست ابتدا به صورت <strong>تخصیص موقت</strong> ثبت می‌شود و پس از بررسی و تأیید سرپرست یا مدیریت سامانه، اسکان شما قطعی خواهد شد.
              </span>
            </div>

            {/* در صورتی که کاربر از قبل تختی دارد */}
            {student.assignedBedId && (
              <div className="mb-5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  شما در حال حاضر دارای اسکان هستید. با ثبت این درخواست جابجایی، تقاضای انتقال شما به این تخت برای سرپرستی ارسال خواهد شد.
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={confirmBedSelection}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-600/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>
                  {student.assignedBedId
                    ? 'ثبت درخواست تغییر و جابجایی به این اتاق/تخت'
                    : 'ثبت درخواست تخصیص موقت اتاق'}
                </span>
              </button>
              <button
                onClick={() => setConfirmModalData(null)}
                className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مدال پرونده، عکس، گزارش، تذکر، نمره ارزیابی و پیام دانشجو */}
      <StudentRoomProfileModal
        isOpen={Boolean(selectedOccupantModal)}
        onClose={() => setSelectedOccupantModal(null)}
        student={selectedOccupantModal?.student || null}
        dorm={currentDorm}
        room={selectedOccupantModal?.room || null}
        bed={selectedOccupantModal?.bed || null}
        actorName={actorName}
        actorRole={actorRole}
        actorId={actorId}
        onDataChanged={onBedSelected}
      />

    </div>
  );
};

// مولفه تکی یک تخت (طبقه بالا یا پایین)
interface BedUnitProps {
  bed: Bed;
  tierLabel: string;
  currentStudentId?: string;
  students: Student[];
  isEligible: boolean;
  isSupervisorMode?: boolean;
  onClick: () => void;
}

const BedUnit: React.FC<BedUnitProps> = ({
  bed,
  tierLabel,
  currentStudentId,
  students,
  isEligible,
  isSupervisorMode = false,
  onClick,
}) => {
  const isOccupied = Boolean(bed.studentId);
  const isMyBed = bed.studentId === currentStudentId;
  const occupant = isOccupied ? students.find((s) => s.studentId === bed.studentId) : null;
  const isTemporary = bed.assignmentStatus === 'temporary' || occupant?.assignmentStatus === 'temporary';

  let bgClass = 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700 text-emerald-950';
  let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
  let statusText = 'خالی و آماده انتخاب';

  if (isMyBed) {
    bgClass = isTemporary
      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/40'
      : 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 dark:border-teal-500 ring-2 ring-teal-500/40';
    badgeClass = isTemporary ? 'bg-amber-400 text-slate-900 font-extrabold' : 'bg-teal-600 text-white font-extrabold';
    statusText = isTemporary ? 'تخت شما (موقت ⏳)' : 'تخت شما (تأیید شده ⭐)';
  } else if (isOccupied) {
    if (isTemporary) {
      bgClass = 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900';
      badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      statusText = `${occupant?.fullName || 'رزرو موقت'} (موقت)`;
    } else {
      bgClass = 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300';
      statusText = occupant?.fullName || 'اشغال شده';
    }
  } else if (!isEligible) {
    bgClass = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60';
    badgeClass = 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    statusText = 'غیرمجاز';
  }

  const bedNum =
    bed.bedNumber ??
    (bed.bunkNumber ? (bed.tier === 'lower' ? bed.bunkNumber * 2 - 1 : bed.bunkNumber * 2) : 1);
  const isOdd = bedNum % 2 === 1;

  return (
    <div
      onClick={onClick}
      className={`p-2.5 rounded-xl border transition cursor-pointer select-none text-right flex flex-col justify-between min-h-[86px] hover:scale-[1.02] active:scale-[0.98] ${bgClass}`}
      title={
        isOccupied
          ? isSupervisorMode
            ? `کلیک روی ${occupant?.fullName || 'دانشجو'} برای مشاهده عکس، اطلاعات و ثبت گزارش/تذکر/نمره/پیام`
            : `ساکن: ${occupant?.fullName || ''} (${occupant?.fieldOfStudy || ''})`
          : `کلیک برای انتخاب تخت ${bedNum}`
      }
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 font-mono text-[11px] font-black">
            تخت {bedNum}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
            ({isOdd ? 'پایین ⬇️' : 'بالا ⬆️'})
          </span>
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold truncate max-w-[95px] ${badgeClass}`}>
          {isMyBed ? (isTemporary ? 'تخت شما (موقت)' : 'تخت شما') : isOccupied ? (isTemporary ? 'رزرو موقت' : 'اشغال') : 'خالی'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 my-1">
        {isMyBed ? (
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ) : isOccupied ? (
          <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        ) : (
          <BedIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        )}

        <div className="text-[11px] font-bold truncate text-slate-800 dark:text-slate-100">
          {statusText}
        </div>
      </div>

      {isOccupied && occupant && (
        <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
          {isSupervisorMode ? 'کلیک: عکس و پرونده / گزارش و پیام' : `${occupant.fieldOfStudy} • ${occupant.city}`}
        </div>
      )}

      {!isOccupied && isEligible && (
        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
          جهت انتخاب کلیک کنید 👈
        </div>
      )}
    </div>
  );
};
