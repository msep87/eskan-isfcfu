import React, { useState } from 'react';
import {
  parseStudentExcel,
  parseDormitoryExcel,
  downloadStudentTemplate,
  downloadDormitoryTemplate,
  toEnglishDigits,
} from '../utils/excelUtils';
import { Storage } from '../utils/storage';
import { Student, Dormitory, Room, Bed } from '../types';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  X,
  FileCheck,
  Building2,
  Users,
  Sparkles,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [tab, setTab] = useState<'students' | 'dorms'>('students');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // پیش‌نمایش دانشجویان
  const [previewStudents, setPreviewStudents] = useState<Student[] | null>(null);
  const [detectedCustomCols, setDetectedCustomCols] = useState<string[]>([]);
  const [replaceMode, setReplaceMode] = useState(false);

  // پیش‌نمایش سراها
  const [previewDormsData, setPreviewDormsData] = useState<{
    dorms: Dormitory[];
    rooms: Room[];
    beds: Bed[];
  } | null>(null);

  if (!isOpen) return null;

  const handleStudentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await parseStudentExcel(file);
      setPreviewStudents(result.students);
      setDetectedCustomCols(result.customColumns);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری فایل اکسل دانشجویان');
    } finally {
      setLoading(false);
    }
  };

  const handleDormFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await parseDormitoryExcel(file);
      setPreviewDormsData(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری فایل اکسل سراها');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudents = async () => {
    if (!previewStudents) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const dorms = Storage.getDormitories();
      const rooms = Storage.getRooms();
      const beds = Storage.getBeds();
      let dormsCreated = false;

      // پردازش تخصیص‌های اسکان از اکسل
      previewStudents.forEach((st) => {
        const dormName = String(st.assignedDormName || '').trim();
        const roomNum = toEnglishDigits(String(st.assignedRoomNumber || '')).trim();
        const bedNumRaw = toEnglishDigits(String(st.assignedBedNumber || '')).trim();

        if (roomNum && bedNumRaw) {
          const bedNum = parseInt(bedNumRaw, 10) || 1;
          // ۱. پیدا کردن یا انتخاب سرا
          let dorm = dorms.find((d) => d.name === dormName || d.name.includes(dormName) || d.id === dormName);
          if (!dorm) {
            if (dorms.length > 0) {
              dorm = dorms[0];
            } else {
              dorm = {
                id: `dorm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: dormName || 'سرای دانشجویی پردیس',
                campus: 'پردیس دانشگاه فرهنگیان',
                gender: 'brothers',
                totalFloors: 3,
                description: 'ایجاد خودکار از روی بارگذاری فایل اکسل',
              };
              dorms.push(dorm);
              dormsCreated = true;
            }
          }

          // ۲. پیدا کردن یا ایجاد اتاق در این سرا با رعایت قاعده زوج=بالا، فرد=پایین
          let room = rooms.find((r) => r.dormId === dorm.id && (r.roomNumber === roomNum || toEnglishDigits(r.roomNumber) === roomNum));
          if (!room) {
            const capacity = Math.max(8, bedNum, Math.ceil(bedNum / 2) * 2);
            const roomId = `room_${dorm.id}_${roomNum}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            room = {
              id: roomId,
              dormId: dorm.id,
              roomNumber: roomNum,
              floor: parseInt(roomNum[0], 10) || 1,
              capacity,
              facilities: ['یخچال', 'شوفاژ', 'کمد دیواری'],
              status: 'active',
            };
            rooms.push(room);

            // ایجاد خودکار تخت‌ها با شماره‌گذاری فرد=پایین، زوج=بالا (مثلاً در ۸ تخته: ۱، ۳، ۵، ۷ پایین)
            const pairs = Math.ceil(capacity / 2);
            let bIdx = 1;
            for (let p = 1; p <= pairs; p++) {
              if (bIdx <= capacity) {
                beds.push({
                  id: `bed_${roomId}_${bIdx}`,
                  roomId,
                  dormId: dorm.id,
                  bedNumber: bIdx,
                  bunkNumber: p,
                  tier: 'lower',
                  label: `تخت ${bIdx} (طبقه پایین)`,
                  studentId: null,
                });
                bIdx++;
              }
              if (bIdx <= capacity) {
                beds.push({
                  id: `bed_${roomId}_${bIdx}`,
                  roomId,
                  dormId: dorm.id,
                  bedNumber: bIdx,
                  bunkNumber: p,
                  tier: 'upper',
                  label: `تخت ${bIdx} (طبقه بالا)`,
                  studentId: null,
                });
                bIdx++;
              }
            }
          }

          // ۳. پیدا کردن یا ایجاد تخت در این اتاق با قاعده زوج=بالا، فرد=پایین
          const expectedTier = bedNum % 2 === 1 ? 'lower' : 'upper';
          const expectedBunk = Math.ceil(bedNum / 2);

          let targetBed = beds.find(
            (b) =>
              b.roomId === room.id &&
              (b.bedNumber === bedNum ||
                toEnglishDigits(b.label).includes(`تخت ${bedNum}`) ||
                (b.bunkNumber === expectedBunk && b.tier === expectedTier))
          );

          if (!targetBed) {
            targetBed = {
              id: `bed_${room.id}_${Date.now()}_${bedNum}`,
              roomId: room.id,
              dormId: dorm.id,
              bedNumber: bedNum,
              bunkNumber: expectedBunk,
              tier: expectedTier,
              label: `تخت ${bedNum} (${expectedTier === 'lower' ? 'طبقه پایین' : 'طبقه بالا'})`,
              studentId: null,
            };
            beds.push(targetBed);
            room.capacity = Math.max(room.capacity, bedNum);
          } else {
            // اطمینان از مقداردهی صحیح شماره تخت و برچسب
            targetBed.bedNumber = bedNum;
            targetBed.tier = expectedTier;
            targetBed.label = `تخت ${bedNum} (${expectedTier === 'lower' ? 'طبقه پایین' : 'طبقه بالا'})`;
          }

          // آزادسازی تخت قبلی دانشجو در صورت وجود
          beds.forEach((b) => {
            if (b.studentId === st.studentId && b.id !== targetBed.id) {
              b.studentId = null;
              b.assignmentStatus = undefined;
            }
          });

          // ثبت تخصیص قطعی
          targetBed.studentId = st.studentId;
          targetBed.assignmentStatus = 'confirmed';

          st.assignedDormId = dorm.id;
          st.assignedRoomId = room.id;
          st.assignedBedId = targetBed.id;
          st.assignmentStatus = 'confirmed';
        } else {
          // اگر ستون‌های اتاق و تخت در اکسل خالی بود: خود دانشجو باید اتاق را انتخاب کند
          st.assignedDormId = undefined;
          st.assignedRoomId = undefined;
          st.assignedBedId = undefined;
          st.assignmentStatus = 'none';

          beds.forEach((b) => {
            if (b.studentId === st.studentId) {
              b.studentId = null;
              b.assignmentStatus = undefined;
            }
          });
        }
      });

      if (dormsCreated) {
        Storage.setDormitories(dorms);
      }
      Storage.setRooms(rooms);
      Storage.setBeds(beds);

      if (replaceMode) {
        Storage.setStudents(previewStudents);
      } else {
        const existing = Storage.getStudents();
        const mergedMap = new Map<string, Student>();
        existing.forEach((s) => mergedMap.set(s.studentId, s));
        previewStudents.forEach((s) => mergedMap.set(s.studentId, s));
        Storage.setStudents(Array.from(mergedMap.values()));
      }

      const syncRes = await Storage.waitForPendingCloudSync();

      const allocatedCount = previewStudents.filter((s) => s.assignedBedId).length;
      const unassignedCount = previewStudents.length - allocatedCount;

      if (syncRes.success) {
        setSuccessMsg(
          `تعداد ${previewStudents.length} دانشجو با موفقیت در دیتابیس ابری ذخیره و همگام‌سازی گردید (${allocatedCount} نفر با اسکان قطعی از اکسل، و ${unassignedCount} نفر فاقد اتاق جهت انتخاب توسط خود دانشجو).`
        );
      } else {
        setSuccessMsg(
          `تعداد ${previewStudents.length} دانشجو در مرورگر ثبت شد، اما همگام‌سازی برخی بخش‌ها با دیتابیس ابری با تأخیر یا خطا مواجه شد.`
        );
      }
      setPreviewStudents(null);
      setTimeout(() => {
        onImportComplete();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره دانشجویان');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDorms = async () => {
    if (!previewDormsData) return;
    setLoading(true);
    setErrorMsg('');

    try {
      if (replaceMode) {
        Storage.setDormitories(previewDormsData.dorms);
        Storage.setRooms(previewDormsData.rooms);
        Storage.setBeds(previewDormsData.beds);
      } else {
        const existingDorms = Storage.getDormitories();
        const existingRooms = Storage.getRooms();
        const existingBeds = Storage.getBeds();

        const dormsMap = new Map(existingDorms.map((d) => [d.id, d]));
        previewDormsData.dorms.forEach((d) => dormsMap.set(d.id, d));

        const roomsMap = new Map(existingRooms.map((r) => [r.id, r]));
        previewDormsData.rooms.forEach((r) => roomsMap.set(r.id, r));

        const bedsMap = new Map(existingBeds.map((b) => [b.id, b]));
        previewDormsData.beds.forEach((b) => bedsMap.set(b.id, b));

        Storage.setDormitories(Array.from(dormsMap.values()));
        Storage.setRooms(Array.from(roomsMap.values()));
        Storage.setBeds(Array.from(bedsMap.values()));
      }

      const syncRes = await Storage.waitForPendingCloudSync();

      if (syncRes.success) {
        setSuccessMsg(`سراها، اتاق‌ها و تخت‌های دوطبقه با موفقیت در دیتابیس ابری ذخیره و همگام‌سازی گردیدند.`);
      } else {
        setSuccessMsg(`سراها و اتاق‌ها در مرورگر ثبت شدند، اما اتصال به دیتابیس ابری با خطا مواجه شد.`);
      }
      setPreviewDormsData(null);
      setTimeout(() => {
        onImportComplete();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره سراها');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              ورود داده‌ها از طریق فایل اکسل (Excel / CSV)
            </h3>
            <p className="text-xs text-slate-500">
              بارگذاری اکسل مشخصات دانشجویان (با پشتیبانی از ستون‌های دلخواه) و سراهای خوابگاهی
            </p>
          </div>
        </div>

        {/* تب‌های اکسل */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
          <button
            onClick={() => {
              setTab('students');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              tab === 'students'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>اکسل دانشجویان (مشخصات و فیلدهای سفارشی)</span>
          </button>
          <button
            onClick={() => {
              setTab('dorms');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              tab === 'dorms'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>اکسل سراها، اتاق‌ها و تخت‌ها</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* محتوای تب دانشجویان */}
        {tab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60">
              <div>
                <h4 className="text-xs font-bold text-teal-950 dark:text-teal-200">
                  دانلود فایل اکسل نمونه و قالب استاندارد
                </h4>
                <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">
                  شامل تمام ستون‌ها به همراه ستون‌های تخصیص اتاق و تخت و فیلدهای دلخواه
                </p>
              </div>
              <button
                type="button"
                onClick={downloadStudentTemplate}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود قالب نمونه اکسل</span>
              </button>
            </div>

            {/* راهنمای اختصاص اتاق و تخت در اکسل ورودی */}
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-extrabold text-indigo-900 dark:text-indigo-100">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>نحوه ساماندهی اتاق‌ها و تخت‌ها از طریق اکسل:</span>
              </div>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                • <strong>ستون‌های اختیاری اسکان:</strong> «نام سرا»، «شماره اتاق» و «شماره تخت»
              </p>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                • <strong>اگر این ستون‌ها پر باشند:</strong> دانشجو به صورت قطعی در همان اتاق و تخت اسکان می‌یابد و پس از ورود، در صورت تمایل می‌تواند <em>درخواست تغییر یا جابجایی اتاق و تخت</em> ثبت کند.
              </p>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                • <strong>اگر این ستون‌ها خالی باشند:</strong> دانشجو فاقد اسکان ثبت شده و خودش موظف است به صورت آنلاین وارد نقشه بصری شده و اتاق و تخت را انتخاب کند.
              </p>
              <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                • <strong>قاعده شماره‌گذاری تخت‌ها:</strong> شماره‌های فرد (۱، ۳، ۵، ۷، ...) طبقه پایین و شماره‌های زوج (۲، ۴، ۶، ۸، ...) طبقه بالا هستند (مثلاً در یک اتاق ۸ تخته، تخت‌های ۱ و ۳ و ۵ و ۷ پایین هستند).
              </p>
            </div>

            {/* دراپ‌زون بارگذاری فایل */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-3xl p-8 text-center transition">
              <UploadCloud className="w-12 h-12 mx-auto text-teal-600 mb-3" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                فایل اکسل دانشجویان را انتخاب یا بکشید و رها کنید
              </h4>
              <p className="text-xs text-slate-500 mb-4">فرمت‌های مجاز: .xlsx, .xls, .csv</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-teal-600/20">
                <span>انتخاب فایل از سیستم</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleStudentFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {loading && <div className="text-center text-xs text-teal-600 font-bold">در حال پردازش فایل اکسل...</div>}

            {/* پیش‌نمایش داده‌های خوانده‌شده */}
            {previewStudents && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      پیش‌نمایش: تعداد {previewStudents.length} دانشجو شناسایی شد
                    </span>
                  </div>

                  {detectedCustomCols.length > 0 && (
                    <div className="text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-xl border border-teal-200 dark:border-teal-800">
                      ستون‌های سفارشی شناسایی شده: {detectedCustomCols.join('، ')}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto max-h-56">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">کد دانشجویی</th>
                        <th className="p-2.5">نام و نام خانوادگی</th>
                        <th className="p-2.5">رشته</th>
                        <th className="p-2.5">ورودی</th>
                        <th className="p-2.5">شهر</th>
                        <th className="p-2.5">همراه</th>
                        <th className="p-2.5 text-indigo-700 dark:text-indigo-400 font-black">تخصیص اسکان در اکسل</th>
                        {detectedCustomCols.map((c) => (
                          <th key={c} className="p-2.5 text-teal-600 font-bold">{c} (سفارشی)</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewStudents.slice(0, 8).map((st, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 font-bold">{st.studentId}</td>
                          <td className="p-2.5">{st.fullName}</td>
                          <td className="p-2.5">{st.fieldOfStudy}</td>
                          <td className="p-2.5">{st.entryTerm}</td>
                          <td className="p-2.5">{st.city}</td>
                          <td className="p-2.5" dir="ltr">{st.mobile}</td>
                          <td className="p-2.5">
                            {st.assignedRoomNumber && st.assignedBedNumber ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                                <span>{st.assignedDormName ? `${st.assignedDormName} • ` : ''}اتاق {st.assignedRoomNumber}</span>
                                <span>•</span>
                                <span>
                                  تخت {st.assignedBedNumber} (
                                  {parseInt(String(st.assignedBedNumber), 10) % 2 === 1 ? 'پایین ⬇️' : 'بالا ⬆️'}
                                  )
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-200 dark:border-amber-800">
                                <span>فاقد اتاق (انتخاب توسط خود دانشجو)</span>
                              </span>
                            )}
                          </td>
                          {detectedCustomCols.map((c) => (
                            <td key={c} className="p-2.5 text-slate-600">{st.customFields?.[c] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceMode}
                      onChange={(e) => setReplaceMode(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>جایگزینی کامل لیست قبلی (در صورت عدم انتخاب، دانشجویان به لیست فعلی اضافه می‌شوند)</span>
                  </label>

                  <button
                    onClick={handleSaveStudents}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    تأیید و ذخیره دائمی در سامانه
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* محتوای تب سراها و اتاق‌ها */}
        {tab === 'dorms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60">
              <div>
                <h4 className="text-xs font-bold text-teal-950 dark:text-teal-200">
                  دانلود فایل اکسل نمونه سراها، اتاق‌ها و تخت‌ها
                </h4>
                <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">
                  ستون‌ها: نام سرا، پردیس، جنسیت، شماره اتاق، طبقه، تعداد تخت، سهمیه رشته، سهمیه ورودی، امکانات
                </p>
              </div>
              <button
                type="button"
                onClick={downloadDormitoryTemplate}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود قالب نمونه سراها</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-3xl p-8 text-center transition">
              <UploadCloud className="w-12 h-12 mx-auto text-teal-600 mb-3" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                فایل اکسل سراها و اتاق‌ها را انتخاب کنید
              </h4>
              <p className="text-xs text-slate-500 mb-4">فرمت‌های مجاز: .xlsx, .xls, .csv</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-teal-600/20">
                <span>انتخاب فایل اکسل سراها</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleDormFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {loading && <div className="text-center text-xs text-teal-600 font-bold">در حال خواندن فایل سراها...</div>}

            {previewDormsData && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs flex items-center justify-between">
                  <span>تعداد سراها: <b>{previewDormsData.dorms.length}</b></span>
                  <span>تعداد اتاق‌ها: <b>{previewDormsData.rooms.length}</b></span>
                  <span className="text-teal-600 font-bold">تعداد کل تخت‌های دوطبقه ایجاد شده: <b>{previewDormsData.beds.length}</b></span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceMode}
                      onChange={(e) => setReplaceMode(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>جایگزینی کامل سراها و اتاق‌های موجود</span>
                  </label>

                  <button
                    onClick={handleSaveDorms}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    تأیید و ساخت سراها و تخت‌ها در سامانه
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
