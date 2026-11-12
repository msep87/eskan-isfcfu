import React, { useState } from 'react';
import { Dormitory, Room, Bed, Student } from '../types';
import { Storage } from '../utils/storage';
import {
  Users,
  Bed as BedIcon,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  UserMinus,
  UserPlus,
  Plus,
  Trash2,
} from 'lucide-react';

interface SupervisorRoomManagerProps {
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  onDataChanged: () => void;
  supervisorDormId?: string;
}

export const SupervisorRoomManager: React.FC<SupervisorRoomManagerProps> = ({
  dorms,
  rooms,
  beds,
  students,
  onDataChanged,
  supervisorDormId,
}) => {
  const [selectedDormId, setSelectedDormId] = useState(
    supervisorDormId && supervisorDormId !== 'all' ? supervisorDormId : dorms[0]?.id || ''
  );
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // جابجایی دانشجو
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [targetBedId, setTargetBedId] = useState('');
  const [moveReason, setMoveReason] = useState('جابجایی به درخواست دانشجو و موافقت سرپرستی');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // افزودن مستقیم دانشجوی فاقد اسکان به تخت خالی
  const [assigningBed, setAssigningBed] = useState<Bed | null>(null);
  const [selectedStudentToAssignId, setSelectedStudentToAssignId] = useState('');
  const [assignStudentSearch, setAssignStudentSearch] = useState('');

  // ایجاد اتاق جدید در سرا
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomCapacity, setNewRoomCapacity] = useState(4);

  // حضور و غیاب شبانه درون‌حافظه
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'leave' | 'late'>>({});

  const currentDorm = dorms.find((d) => d.id === selectedDormId) || dorms[0];
  const dormRooms = rooms.filter((r) => r.dormId === selectedDormId);

  // لیست دانشجویان فاقد اسکان
  const unassignedStudents = students.filter(
    (s) => !s.assignedBedId || s.assignmentStatus === 'none'
  );

  const filteredUnassignedStudents = unassignedStudents.filter((s) => {
    if (!assignStudentSearch.trim()) return true;
    const q = assignStudentSearch.trim().toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.studentId.includes(q) ||
      s.fieldOfStudy.toLowerCase().includes(q)
    );
  });

  const filteredRooms = dormRooms.filter((r) => {
    if (selectedFloor !== 'all' && r.floor !== selectedFloor) return false;
    if (searchQuery.trim() && !r.roomNumber.includes(searchQuery.trim())) return false;
    return true;
  });

  // تخت‌های خالی این سرا برای جابجایی
  const vacantBedsInDorm = beds.filter((b) => b.dormId === selectedDormId && !b.studentId);

  // حذف دانشجو از اتاق (آزادسازی تخت)
  const handleEvictStudent = (st: Student) => {
    if (
      confirm(
        `آیا از لغو اسکان و حذف دانشجو «${st.fullName}» از این اتاق اطمینان دارید؟\nپرونده دانشجو در سیستم محفوظ می‌ماند و وضعیت وی به «فاقد اسکان» تغییر می‌یابد و تخت آزاد می‌گردد.`
      )
    ) {
      const res = Storage.releaseBed(st.studentId);
      setActionMessage({
        type: 'success',
        text: `دانشجو «${st.fullName}» از اتاق حذف و تخت وی با موفقیت آزاد شد.`,
      });
      onDataChanged();
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  // تخصیص مستقیم دانشجوی فاقد اسکان به تخت خالی
  const handleAssignStudentToBed = () => {
    if (!assigningBed || !selectedStudentToAssignId) return;
    const res = Storage.assignBedToStudent(selectedStudentToAssignId, assigningBed.id, true);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setAssigningBed(null);
      setSelectedStudentToAssignId('');
      onDataChanged();
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setActionMessage(null), 3500);
  };

  // ایجاد اتاق جدید در سرا
  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;
    const res = Storage.addRoomWithBeds(selectedDormId, newRoomNumber.trim(), newRoomFloor, newRoomCapacity);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setIsCreateRoomModalOpen(false);
      setNewRoomNumber('');
      onDataChanged();
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setActionMessage(null), 3500);
  };

  // حذف کامل اتاق
  const handleDeleteRoom = (roomId: string, roomNumber: string) => {
    if (confirm(`آیا از حذف کامل اتاق شماره ${roomNumber} و آزادسازی کلیه تخت‌های آن اطمینان دارید؟`)) {
      const res = Storage.deleteRoom(roomId);
      setActionMessage({ type: 'success', text: res.message });
      onDataChanged();
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleAppointRepresentative = (roomId: string, studentId: string) => {
    Storage.setRoomRepresentative(roomId, studentId);
    setActionMessage({ type: 'success', text: 'نماینده اتاق با موفقیت تعیین شد.' });
    onDataChanged();
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleRemoveRepresentative = (roomId: string) => {
    Storage.setRoomRepresentative(roomId, undefined);
    setActionMessage({ type: 'success', text: 'نماینده اتاق حذف گردید.' });
    onDataChanged();
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleConfirmMove = () => {
    if (!movingStudent || !targetBedId) return;

    const result = Storage.moveStudentBySupervisor(movingStudent.studentId, targetBedId, moveReason);
    if (result.success) {
      setActionMessage({ type: 'success', text: `دانشجو با موفقیت جابجا شد: ${result.message}` });
      setMovingStudent(null);
      setTargetBedId('');
      onDataChanged();
    } else {
      setActionMessage({ type: 'error', text: result.message });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const setStudentAttendance = (studentId: string, status: 'present' | 'absent' | 'leave' | 'late') => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  return (
    <div className="space-y-6">

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* نوار انتخاب سرا و ابزارها */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {dorms.map((dorm) => (
              <button
                key={dorm.id}
                onClick={() => {
                  setSelectedDormId(dorm.id);
                  setSelectedFloor('all');
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                  selectedDormId === dorm.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {dorm.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateRoomModalOpen(true)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت اتاق جدید</span>
            </button>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="جستجوی شماره اتاق..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* لیست اتاق‌ها و ساکنین با اکشن‌های سرپرستی */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRooms.map((room) => {
          const roomBeds = beds.filter((b) => b.roomId === room.id);
          const roomStudents = roomBeds
            .map((b) => ({
              bed: b,
              student: students.find((s) => s.studentId === b.studentId),
            }))
            .filter((item) => item.student);

          const vacantCount = roomBeds.filter((b) => !b.studentId).length;

          return (
            <div
              key={room.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      اتاق {room.roomNumber}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600">
                      طبقه {room.floor}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    ظرفیت: {room.capacity} نفر ({roomStudents.length} ساکن، {vacantCount} تخت خالی)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {room.representativeStudentId ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-xl border border-purple-200">
                        🌟 نماینده اتاق تعیین شده
                      </span>
                      <button
                        onClick={() => handleRemoveRepresentative(room.id)}
                        className="text-[10px] text-slate-400 hover:text-rose-500"
                        title="حذف نماینده"
                      >
                        عزل
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-200">
                      فاقد نماینده
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteRoom(room.id, room.roomNumber)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950"
                    title="حذف کامل این اتاق و تخت‌های آن"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* لیست دانشجویان ساکن در اتاق */}
              {roomStudents.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400">
                  این اتاق در حال حاضر کاملاً خالی است.
                </div>
              ) : (
                <div className="space-y-3">
                  {roomStudents.map(({ bed, student: st }) => {
                    if (!st) return null;
                    const isRepresentative = room.representativeStudentId === st.studentId;
                    const curAtt = attendance[st.studentId] || 'present';

                    return (
                      <div
                        key={st.studentId}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            {st.photoUrl ? (
                              <img
                                src={st.photoUrl}
                                alt={st.fullName}
                                className="w-9 h-9 rounded-xl object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                                style={{ backgroundColor: st.avatarColor || '#0d9488' }}
                              >
                                {st.fullName.slice(0, 1)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{st.fullName}</span>
                                {isRepresentative && <span className="text-[10px] text-purple-600">🌟</span>}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {st.fieldOfStudy} • ورودی {st.entryTerm} • {st.city}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-lg border border-teal-200 block text-center mb-1">
                              {bed.label}
                            </span>
                          </div>
                        </div>

                        {/* ابزارهای سرپرستی و مدیریتی برای هر دانشجو */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {!isRepresentative && (
                              <button
                                onClick={() => handleAppointRepresentative(room.id, st.studentId)}
                                className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>نماینده</span>
                              </button>
                            )}

                            <button
                              onClick={() => setMovingStudent(st)}
                              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>جابجایی تخت</span>
                            </button>

                            {/* حذف دانشجو از اتاق / آزادسازی تخت */}
                            <button
                              onClick={() => handleEvictStudent(st)}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="لغو اسکان و حذف دانشجو از این اتاق"
                            >
                              <UserMinus className="w-3 h-3" />
                              <span>حذف از اتاق</span>
                            </button>
                          </div>

                          {/* وضعیت حضور شبانه */}
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400">حضور:</span>
                            <button
                              onClick={() => setStudentAttendance(st.studentId, 'present')}
                              className={`px-1.5 py-0.5 rounded-md font-bold ${
                                curAtt === 'present' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              حاضر
                            </button>
                            <button
                              onClick={() => setStudentAttendance(st.studentId, 'leave')}
                              className={`px-1.5 py-0.5 rounded-md font-bold ${
                                curAtt === 'leave' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              مرخصی
                            </button>
                            <button
                              onClick={() => setStudentAttendance(st.studentId, 'absent')}
                              className={`px-1.5 py-0.5 rounded-md font-bold ${
                                curAtt === 'absent' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              غایب
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* تخت‌های خالی این اتاق با امکان افزودن مستقیم دانشجوی فاقد اسکان */}
              {vacantCount > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      تخت‌های خالی اتاق ({vacantCount} تخت):
                    </span>
                    <span className="text-[10px] text-teal-600 font-semibold">
                      قابلیت افزودن مستقیم دانشجویان فاقد اسکان
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {roomBeds
                      .filter((b) => !b.studentId)
                      .map((b) => (
                        <div
                          key={b.id}
                          className="p-2 rounded-xl border border-dashed border-teal-300 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-1.5 text-xs text-teal-900 dark:text-teal-200 font-bold truncate">
                            <BedIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="truncate">{b.label}</span>
                          </div>
                          <button
                            onClick={() => {
                              setAssigningBed(b);
                              setSelectedStudentToAssignId(unassignedStudents[0]?.studentId || '');
                            }}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs hover:scale-105"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>+ افزودن دانشجو</span>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* مدال جابجایی دستی دانشجو */}
      {movingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
              جابجایی دانشجو: {movingStudent.fullName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              انتخاب تخت مقصد برای انتقال دانشجو به همراه ثبت علت در سوابق
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تخت و اتاق مقصد (تخت‌های خالی موجود):
                </label>
                <select
                  value={targetBedId}
                  onChange={(e) => setTargetBedId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- یک تخت خالی انتخاب کنید --</option>
                  {vacantBedsInDorm.map((b) => {
                    const r = rooms.find((rm) => rm.id === b.roomId);
                    return (
                      <option key={b.id} value={b.id}>
                        اتاق {r?.roomNumber} - {b.label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  علت جابجایی (برای ارسال به پیام‌های دانشجو):
                </label>
                <input
                  type="text"
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleConfirmMove}
                  disabled={!targetBedId}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  ثبت جابجایی
                </button>
                <button
                  onClick={() => setMovingStudent(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مدال تخصیص مستقیم دانشجوی فاقد اسکان به تخت خالی */}
      {assigningBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <span>تخصیص دانشجوی فاقد اتاق به این تخت خالی</span>
              </h3>
              <button
                onClick={() => setAssigningBed(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs">
              <span className="font-bold text-teal-950 dark:text-teal-200 block">
                موقعیت تخت انتخابی:
              </span>
              <span className="text-teal-800 dark:text-teal-300 mt-1 block">
                {currentDorm?.name || 'سرا'} • {assigningBed.label}
              </span>
            </div>

            {unassignedStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                در حال حاضر هیچ دانشجوی فاقد اسکانی در سامانه یافت نشد. همه دانشجویان دارای اتاق هستند.
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    جستجو میان دانشجویان فاقد اسکان ({unassignedStudents.length} نفر):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="نام، کد دانشجویی یا رشته..."
                      value={assignStudentSearch}
                      onChange={(e) => setAssignStudentSearch(e.target.value)}
                      className="w-full pr-8 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <Search className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400" />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-700 rounded-2xl p-2">
                  {filteredUnassignedStudents.map((st) => (
                    <label
                      key={st.studentId}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                        selectedStudentToAssignId === st.studentId
                          ? 'bg-teal-50 dark:bg-teal-950 border-teal-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="studentToAssign"
                          value={st.studentId}
                          checked={selectedStudentToAssignId === st.studentId}
                          onChange={() => setSelectedStudentToAssignId(st.studentId)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {st.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            کد: {st.studentId} • {st.fieldOfStudy} ({st.city})
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                        ورودی {st.entryTerm}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAssignStudentToBed}
                    disabled={!selectedStudentToAssignId}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تخصیص قطعی به این تخت</span>
                  </button>
                  <button
                    onClick={() => setAssigningBed(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* مدال ثبت اتاق جدید در سرا توسط مدیر یا سرپرست */}
      {isCreateRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <span>ثبت اتاق جدید در {currentDorm?.name || 'سرا'}</span>
              </h3>
              <button
                onClick={() => setIsCreateRoomModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoomSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره اتاق *
                </label>
                <input
                  type="text"
                  placeholder="مثلاً 104 یا 208"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  طبقه
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={newRoomFloor}
                  onChange={(e) => setNewRoomFloor(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ظرفیت اتاق (تعداد تخت‌ها)
                </label>
                <select
                  value={newRoomCapacity}
                  onChange={(e) => setNewRoomCapacity(Number(e.target.value) || 4)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value={2}>۲ نفره (۱ سرویس دوطبقه)</option>
                  <option value={4}>۴ نفره (۲ سرویس دوطبقه)</option>
                  <option value={6}>۶ نفره (۳ سرویس دوطبقه)</option>
                  <option value={8}>۸ نفره (۴ سرویس دوطبقه)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  سامانه به صورت هوشمند تخت‌های دوطبقه (بالا و پایین) را برای این اتاق ایجاد خواهد کرد.
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت اتاق و ساخت تخت‌ها</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateRoomModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
