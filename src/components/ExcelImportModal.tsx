import React, { useState, useEffect } from 'react';
import {
  parseStudentExcel,
  parseDormitoryExcel,
  downloadStudentTemplate,
  downloadDormitoryTemplate,
  parseSupervisorExcel,
  downloadSupervisorTemplate,
  parseMaintenanceExcel,
  downloadMaintenanceTemplate,
  parseCounselorExcel,
  downloadCounselorTemplate,
  parseWarehouseExcel,
  downloadWarehouseTemplate,
  toEnglishDigits,
} from '../utils/excelUtils';
import { Storage } from '../utils/storage';
import {
  Student,
  Dormitory,
  Room,
  Bed,
  Supervisor,
  MaintenanceStaff,
  CounselorStaff,
  WarehouseStaff,
} from '../types';
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
  UserCheck,
  Wrench,
  HeartHandshake,
  Package,
} from 'lucide-react';

export type ExcelImportTab =
  | 'students'
  | 'dorms'
  | 'supervisors'
  | 'maintenance'
  | 'counselors'
  | 'warehouse';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  initialTab?: ExcelImportTab;
  allowStaffTabs?: boolean;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  initialTab = 'students',
  allowStaffTabs = true,
}) => {
  const [tab, setTab] = useState<ExcelImportTab>('students');

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

  // پیش‌نمایش کاربران سرپرست، تأسیسات، مشاور و انبار
  const [previewSupervisors, setPreviewSupervisors] = useState<{
    list: Supervisor[];
    skippedRows: number;
  } | null>(null);

  const [previewMaintenance, setPreviewMaintenance] = useState<{
    list: MaintenanceStaff[];
    skippedRows: number;
  } | null>(null);

  const [previewCounselors, setPreviewCounselors] = useState<{
    list: CounselorStaff[];
    skippedRows: number;
  } | null>(null);

  const [previewWarehouse, setPreviewWarehouse] = useState<{
    list: WarehouseStaff[];
    skippedRows: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const targetTab = allowStaffTabs
        ? initialTab || 'students'
        : initialTab === 'dorms'
        ? 'dorms'
        : 'students';
      setTab(targetTab);
      setErrorMsg('');
      setSuccessMsg('');
      setReplaceMode(false);
    }
  }, [isOpen, initialTab, allowStaffTabs]);

  if (!isOpen) return null;

  const existingDorms = Storage.getDormitories();
  const dormNameMap = new Map(existingDorms.map((d) => [d.id, d.name]));

  const formatDormListLabel = (ids?: string[]) => {
    if (!ids || ids.length === 0) return 'نامشخص';
    if (ids.includes('all') || (existingDorms.length > 0 && ids.length >= existingDorms.length)) {
      return 'همه سراهای دانشگاه';
    }
    return ids.map((id) => dormNameMap.get(id) || id).join('، ');
  };

  const switchTab = (nextTab: ExcelImportTab) => {
    setTab(nextTab);
    setErrorMsg('');
    setSuccessMsg('');
    setReplaceMode(false);
  };

  const handleStudentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
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
    e.target.value = '';
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

  const handleSupervisorFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await parseSupervisorExcel(file, Storage.getDormitories());
      setPreviewSupervisors({ list: res.supervisors, skippedRows: res.skippedRows });
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری فایل اکسل کاربران سرپرست');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await parseMaintenanceExcel(file, Storage.getDormitories());
      setPreviewMaintenance({ list: res.staff, skippedRows: res.skippedRows });
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری فایل اکسل کاربران تأسیسات');
    } finally {
      setLoading(false);
    }
  };

  const handleCounselorFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await parseCounselorExcel(file, Storage.getDormitories());
      setPreviewCounselors({ list: res.counselors, skippedRows: res.skippedRows });
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری فایل اکسل کاربران مشاور');
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await parseWarehouseExcel(file);
      setPreviewWarehouse({ list: res.staff, skippedRows: res.skippedRows });
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری فایل اکسل کاربران انبار');
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

      previewStudents.forEach((st) => {
        const dormName = String(st.assignedDormName || '').trim();
        const roomNum = toEnglishDigits(String(st.assignedRoomNumber || '')).trim();
        const bedNumRaw = toEnglishDigits(String(st.assignedBedNumber || '')).trim();

        if (roomNum && bedNumRaw) {
          const bedNum = parseInt(bedNumRaw, 10) || 1;
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
            targetBed.bedNumber = bedNum;
            targetBed.tier = expectedTier;
            targetBed.label = `تخت ${bedNum} (${expectedTier === 'lower' ? 'طبقه پایین' : 'طبقه بالا'})`;
          }

          beds.forEach((b) => {
            if (b.studentId === st.studentId && b.id !== targetBed.id) {
              b.studentId = null;
              b.assignmentStatus = undefined;
            }
          });

          targetBed.studentId = st.studentId;
          targetBed.assignmentStatus = 'confirmed';

          st.assignedDormId = dorm.id;
          st.assignedRoomId = room.id;
          st.assignedBedId = targetBed.id;
          st.assignmentStatus = 'confirmed';
        } else {
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

      Storage.addActivityLog({
        category: 'excel',
        action: replaceMode ? 'بارگذاری و جایگزینی اکسل دانشجویان' : 'بارگذاری و افزودن اکسل دانشجویان',
        details: `${previewStudents.length} دانشجو از فایل اکسل وارد شد (${allocatedCount} نفر با اسکان قطعی، ${unassignedCount} نفر بدون اتاق).`,
        targetName: `${previewStudents.length} دانشجو`,
      });

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

      Storage.addActivityLog({
        category: 'excel',
        action: replaceMode ? 'بارگذاری و جایگزینی اکسل سراها' : 'بارگذاری و افزودن اکسل سراها و اتاق‌ها',
        details: `${previewDormsData.dorms.length} سرا، ${previewDormsData.rooms.length} اتاق و ${previewDormsData.beds.length} تخت از اکسل ثبت شد.`,
        targetName: `${previewDormsData.rooms.length} اتاق`,
      });

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

  const handleSaveSupervisors = async () => {
    if (!previewSupervisors) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const incoming = previewSupervisors.list;
      if (replaceMode) {
        Storage.setSupervisors(incoming);
      } else {
        const existing = Storage.getSupervisors();
        const mergedMap = new Map<string, Supervisor>();
        existing.forEach((s) => mergedMap.set(s.username.trim().toLowerCase(), s));
        incoming.forEach((s) => {
          const key = s.username.trim().toLowerCase();
          const prev = mergedMap.get(key);
          mergedMap.set(key, prev ? { ...s, id: prev.id } : s);
        });
        Storage.setSupervisors(Array.from(mergedMap.values()));
      }

      const syncRes = await Storage.waitForPendingCloudSync();

      Storage.addActivityLog({
        category: 'excel',
        action: replaceMode ? 'بارگذاری و جایگزینی اکسل سرپرستان' : 'ثبت گروهی کاربران سرپرست از اکسل',
        details: `تعداد ${incoming.length} حساب کاربری سرپرست سرا از فایل اکسل ثبت و ذخیره شد.`,
        targetName: `${incoming.length} سرپرست`,
      });

      setSuccessMsg(
        syncRes.success
          ? `تعداد ${incoming.length} کاربر سرپرست با موفقیت در دیتابیس ابری ثبت و همگام‌سازی شد.`
          : `تعداد ${incoming.length} کاربر سرپرست در مرورگر ثبت شد، اما همگام‌سازی ابری با تأخیر مواجه شد.`
      );
      setPreviewSupervisors(null);
      setTimeout(() => onImportComplete(), 1100);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره کاربران سرپرست');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaintenance = async () => {
    if (!previewMaintenance) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const incoming = previewMaintenance.list;
      if (replaceMode) {
        Storage.setMaintenanceStaff(incoming);
      } else {
        const existing = Storage.getMaintenanceStaff();
        const mergedMap = new Map<string, MaintenanceStaff>();
        existing.forEach((s) => mergedMap.set(s.username.trim().toLowerCase(), s));
        incoming.forEach((s) => {
          const key = s.username.trim().toLowerCase();
          const prev = mergedMap.get(key);
          mergedMap.set(key, prev ? { ...s, id: prev.id } : s);
        });
        Storage.setMaintenanceStaff(Array.from(mergedMap.values()));
      }

      const syncRes = await Storage.waitForPendingCloudSync();

      Storage.addActivityLog({
        category: 'excel',
        action: replaceMode ? 'بارگذاری و جایگزینی اکسل پرسنل تأسیسات' : 'ثبت گروهی کاربران تأسیسات از اکسل',
        details: `تعداد ${incoming.length} حساب کاربری تکنسین و کارشناس تأسیسات از فایل اکسل ثبت شد.`,
        targetName: `${incoming.length} کاربر تأسیسات`,
      });

      setSuccessMsg(
        syncRes.success
          ? `تعداد ${incoming.length} کاربر تأسیسات با موفقیت در دیتابیس ابری ثبت و همگام‌سازی شد.`
          : `تعداد ${incoming.length} کاربر تأسیسات در مرورگر ثبت شد، اما همگام‌سازی ابری با تأخیر مواجه شد.`
      );
      setPreviewMaintenance(null);
      setTimeout(() => onImportComplete(), 1100);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره کاربران تأسیسات');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCounselors = async () => {
    if (!previewCounselors) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const incoming = previewCounselors.list;
      if (replaceMode) {
        Storage.setCounselors(incoming);
      } else {
        const existing = Storage.getCounselors();
        const mergedMap = new Map<string, CounselorStaff>();
        existing.forEach((c) => mergedMap.set(c.username.trim().toLowerCase(), c));
        incoming.forEach((c) => {
          const key = c.username.trim().toLowerCase();
          const prev = mergedMap.get(key);
          mergedMap.set(key, prev ? { ...c, id: prev.id } : c);
        });
        Storage.setCounselors(Array.from(mergedMap.values()));
      }

      const syncRes = await Storage.waitForPendingCloudSync();

      Storage.addActivityLog({
        category: 'excel',
        action: replaceMode ? 'بارگذاری و جایگزینی اکسل مشاوران' : 'ثبت گروهی کاربران مشاور از اکسل',
        details: `تعداد ${incoming.length} حساب کاربری مشاور و روانشناس از فایل اکسل ثبت شد.`,
        targetName: `${incoming.length} کاربر مشاور`,
      });

      setSuccessMsg(
        syncRes.success
          ? `تعداد ${incoming.length} کاربر مشاور با موفقیت در دیتابیس ابری ثبت و همگام‌سازی شد.`
          : `تعداد ${incoming.length} کاربر مشاور در مرورگر ثبت شد، اما همگام‌سازی ابری با تأخیر مواجه شد.`
      );
      setPreviewCounselors(null);
      setTimeout(() => onImportComplete(), 1100);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره کاربران مشاور');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWarehouse = async () => {
    if (!previewWarehouse) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const incoming = previewWarehouse.list;
      if (replaceMode) {
        Storage.setWarehouseStaff(incoming);
      } else {
        const existing = Storage.getWarehouseStaff();
        const mergedMap = new Map<string, WarehouseStaff>();
        existing.forEach((w) => mergedMap.set(w.username.trim().toLowerCase(), w));
        incoming.forEach((w) => {
          const key = w.username.trim().toLowerCase();
          const prev = mergedMap.get(key);
          mergedMap.set(key, prev ? { ...w, id: prev.id } : w);
        });
        Storage.setWarehouseStaff(Array.from(mergedMap.values()));
      }

      const syncRes = await Storage.waitForPendingCloudSync();

      Storage.addActivityLog({
        category: 'excel',
        action: replaceMode ? 'بارگذاری و جایگزینی اکسل پرسنل انبار' : 'ثبت گروهی کاربران انبار از اکسل',
        details: `تعداد ${incoming.length} حساب کاربری مسئول انبار و کارپردازی از فایل اکسل ثبت شد.`,
        targetName: `${incoming.length} کاربر انبار`,
      });

      setSuccessMsg(
        syncRes.success
          ? `تعداد ${incoming.length} کاربر انبار با موفقیت در دیتابیس ابری ثبت و همگام‌سازی شد.`
          : `تعداد ${incoming.length} کاربر انبار در مرورگر ثبت شد، اما همگام‌سازی ابری با تأخیر مواجه شد.`
      );
      setPreviewWarehouse(null);
      setTimeout(() => onImportComplete(), 1100);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره کاربران انبار');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              ورود داده‌ها و ثبت کاربران از طریق فایل اکسل (Excel / CSV)
            </h3>
            <p className="text-xs text-slate-500">
              {allowStaffTabs
                ? 'بارگذاری مجزا برای دانشجویان، سراها و اتاق‌ها، سرپرستان، پرسنل تأسیسات، مشاوران و انبارداران'
                : 'بارگذاری اکسل مشخصات دانشجویان (با پشتیبانی از ستون‌های دلخواه) و سراهای خوابگاهی'}
            </p>
          </div>
        </div>

        {/* تب‌های انتخاب نوع فایل اکسل */}
        <div
          className={`grid gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 ${
            allowStaffTabs ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2'
          }`}
        >
          <button
            type="button"
            onClick={() => switchTab('students')}
            className={`py-2.5 px-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'students'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>دانشجویان</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('dorms')}
            className={`py-2.5 px-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'dorms'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>سراها و اتاق‌ها</span>
          </button>

          {allowStaffTabs && (
            <>
              <button
                type="button"
                onClick={() => switchTab('supervisors')}
                className={`py-2.5 px-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'supervisors'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>کاربران سرپرست</span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('maintenance')}
                className={`py-2.5 px-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'maintenance'
                    ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>کاربران تأسیسات</span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('counselors')}
                className={`py-2.5 px-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'counselors'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                <span>کاربران مشاور</span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('warehouse')}
                className={`py-2.5 px-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'warehouse'
                    ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span>کاربران انبار</span>
              </button>
            </>
          )}
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

        {/* ۱. محتوای تب دانشجویان */}
        {tab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60">
              <div>
                <h4 className="text-xs font-bold text-teal-950 dark:text-teal-200">
                  دانلود فایل اکسل نمونه و قالب استاندارد دانشجویان
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
                • <strong>قاعده شماره‌گذاری تخت‌ها:</strong> شماره‌های فرد (۱، ۳، ۵، ۷، ...) طبقه پایین و شماره‌های زوج (۲، ۴، ۶، ۸، ...) طبقه بالا هستند.
              </p>
            </div>

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

            {previewStudents && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
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
                      {previewStudents.slice(0, 12).map((st, i) => (
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
                                  {parseInt(String(st.assignedBedNumber), 10) % 2 === 1 ? 'پایین' : 'بالا'}
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

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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
                    type="button"
                    disabled={loading}
                    onClick={handleSaveStudents}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    تأیید و ذخیره دائمی در سامانه
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ۲. محتوای تب سراها و اتاق‌ها */}
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
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs flex items-center justify-between flex-wrap gap-2">
                  <span>تعداد سراها: <b>{previewDormsData.dorms.length}</b></span>
                  <span>تعداد اتاق‌ها: <b>{previewDormsData.rooms.length}</b></span>
                  <span className="text-teal-600 font-bold">تعداد کل تخت‌های دوطبقه ایجاد شده: <b>{previewDormsData.beds.length}</b></span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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
                    type="button"
                    disabled={loading}
                    onClick={handleSaveDorms}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    تأیید و ساخت سراها و تخت‌ها در سامانه
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ۳. محتوای تب کاربران سرپرست */}
        {allowStaffTabs && tab === 'supervisors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  دانلود قالب اکسل ثبت گروهی کاربران سرپرست سرا
                </h4>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">
                  ستون‌ها: نام و نام خانوادگی، نام کاربری، کلمه عبور، شماره تماس، سراهای تحت پوشش (یا «همه سراها»)
                </p>
              </div>
              <button
                type="button"
                onClick={downloadSupervisorTemplate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود قالب اکسل سرپرستان</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-3xl p-8 text-center transition">
              <UploadCloud className="w-12 h-12 mx-auto text-indigo-600 mb-3" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                فایل اکسل کاربران سرپرست را انتخاب کنید
              </h4>
              <p className="text-xs text-slate-500 mb-4">فرمت‌های مجاز: .xlsx, .xls, .csv (نام کاربری تکراری بروزرسانی می‌شود)</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-indigo-600/20">
                <span>انتخاب فایل اکسل سرپرستان</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleSupervisorFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {loading && <div className="text-center text-xs text-indigo-600 font-bold">در حال پردازش فایل اکسل سرپرستان...</div>}

            {previewSupervisors && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      پیش‌نمایش: {previewSupervisors.list.length} کاربر سرپرست آماده ثبت
                    </span>
                  </div>
                  {previewSupervisors.skippedRows > 0 && (
                    <span className="text-[11px] text-amber-600 font-semibold">
                      ({previewSupervisors.skippedRows} ردیف خالی نادیده گرفته شد)
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto max-h-60">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">ردیف</th>
                        <th className="p-2.5">نام و نام خانوادگی</th>
                        <th className="p-2.5">نام کاربری</th>
                        <th className="p-2.5">کلمه عبور</th>
                        <th className="p-2.5">شماره تماس</th>
                        <th className="p-2.5">سراهای تحت نظارت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewSupervisors.list.map((sup, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5">{i + 1}</td>
                          <td className="p-2.5 font-bold">{sup.fullName}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{sup.username}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{sup.password}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{sup.phone}</td>
                          <td className="p-2.5 text-indigo-700 dark:text-indigo-300 font-semibold">
                            {formatDormListLabel(sup.assignedDormIds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceMode}
                      onChange={(e) => setReplaceMode(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>جایگزینی کامل لیست سرپرستان قبلی (در غیر این صورت به لیست فعلی افزوده/بروزرسانی می‌شود)</span>
                  </label>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSaveSupervisors}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    تأیید و ثبت سرپرستان در سامانه ابری
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ۴. محتوای تب کاربران تأسیسات */}
        {allowStaffTabs && tab === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <div>
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  دانلود قالب اکسل ثبت گروهی کاربران و تکنسین‌های تأسیسات
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
                  ستون‌ها: نام و نام خانوادگی، نام کاربری، کلمه عبور، تخصص فنی، شماره تماس، سراهای تحت پوشش، وضعیت، توضیحات
                </p>
              </div>
              <button
                type="button"
                onClick={downloadMaintenanceTemplate}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود قالب اکسل تأسیسات</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-3xl p-8 text-center transition">
              <UploadCloud className="w-12 h-12 mx-auto text-amber-600 mb-3" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                فایل اکسل کاربران تأسیسات را انتخاب کنید
              </h4>
              <p className="text-xs text-slate-500 mb-4">فرمت‌های مجاز: .xlsx, .xls, .csv (نام کاربری تکراری بروزرسانی می‌شود)</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-amber-600/20">
                <span>انتخاب فایل اکسل تأسیسات</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleMaintenanceFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {loading && <div className="text-center text-xs text-amber-600 font-bold">در حال پردازش فایل اکسل تأسیسات...</div>}

            {previewMaintenance && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      پیش‌نمایش: {previewMaintenance.list.length} کاربر تأسیسات آماده ثبت
                    </span>
                  </div>
                  {previewMaintenance.skippedRows > 0 && (
                    <span className="text-[11px] text-amber-600 font-semibold">
                      ({previewMaintenance.skippedRows} ردیف خالی نادیده گرفته شد)
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto max-h-60">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">ردیف</th>
                        <th className="p-2.5">نام و نام خانوادگی</th>
                        <th className="p-2.5">تخصص فنی</th>
                        <th className="p-2.5">نام کاربری</th>
                        <th className="p-2.5">کلمه عبور</th>
                        <th className="p-2.5">شماره تماس</th>
                        <th className="p-2.5">سراهای تحت پوشش</th>
                        <th className="p-2.5">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewMaintenance.list.map((tech, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5">{i + 1}</td>
                          <td className="p-2.5 font-bold">{tech.fullName}</td>
                          <td className="p-2.5 text-amber-700 dark:text-amber-300 font-semibold">{tech.specialty}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{tech.username}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{tech.password}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{tech.mobile || tech.phone}</td>
                          <td className="p-2.5">{formatDormListLabel(tech.coveredDormIds)}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tech.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {tech.status === 'active' ? 'فعال' : 'غیرفعال'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceMode}
                      onChange={(e) => setReplaceMode(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>جایگزینی کامل لیست پرسنل تأسیسات قبلی</span>
                  </label>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSaveMaintenance}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    تأیید و ثبت پرسنل تأسیسات در سامانه ابری
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ۵. محتوای تب کاربران مشاور */}
        {allowStaffTabs && tab === 'counselors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <div>
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  دانلود قالب اکسل ثبت گروهی کاربران مشاور و روانشناس
                </h4>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">
                  ستون‌ها: نام و نام خانوادگی، نام کاربری، کلمه عبور، تخصص مشاوره، مقطع تحصیلی، شماره تماس، محل استقرار، پردیس، سراهای تحت پوشش، وضعیت
                </p>
              </div>
              <button
                type="button"
                onClick={downloadCounselorTemplate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود قالب اکسل مشاوران</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-3xl p-8 text-center transition">
              <UploadCloud className="w-12 h-12 mx-auto text-emerald-600 mb-3" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                فایل اکسل کاربران مشاور را انتخاب کنید
              </h4>
              <p className="text-xs text-slate-500 mb-4">فرمت‌های مجاز: .xlsx, .xls, .csv (نام کاربری تکراری بروزرسانی می‌شود)</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-emerald-600/20">
                <span>انتخاب فایل اکسل مشاوران</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleCounselorFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {loading && <div className="text-center text-xs text-emerald-600 font-bold">در حال پردازش فایل اکسل مشاوران...</div>}

            {previewCounselors && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      پیش‌نمایش: {previewCounselors.list.length} کاربر مشاور آماده ثبت
                    </span>
                  </div>
                  {previewCounselors.skippedRows > 0 && (
                    <span className="text-[11px] text-amber-600 font-semibold">
                      ({previewCounselors.skippedRows} ردیف خالی نادیده گرفته شد)
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto max-h-60">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">ردیف</th>
                        <th className="p-2.5">نام و نام خانوادگی</th>
                        <th className="p-2.5">تخصص و مقطع</th>
                        <th className="p-2.5">نام کاربری</th>
                        <th className="p-2.5">کلمه عبور</th>
                        <th className="p-2.5">شماره تماس</th>
                        <th className="p-2.5">محل استقرار</th>
                        <th className="p-2.5">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewCounselors.list.map((cns, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5">{i + 1}</td>
                          <td className="p-2.5 font-bold">{cns.fullName}</td>
                          <td className="p-2.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                            {cns.specialty}
                            {cns.educationLevel ? ` (${cns.educationLevel})` : ''}
                          </td>
                          <td className="p-2.5 font-mono" dir="ltr">{cns.username}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{cns.password}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{cns.phone}</td>
                          <td className="p-2.5">{cns.officeLocation || 'مرکز مشاوره'}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cns.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {cns.status === 'active' ? 'فعال' : 'غیرفعال'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceMode}
                      onChange={(e) => setReplaceMode(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>جایگزینی کامل لیست مشاوران قبلی</span>
                  </label>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSaveCounselors}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    تأیید و ثبت مشاوران در سامانه ابری
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ۶. محتوای تب کاربران انبار */}
        {allowStaffTabs && tab === 'warehouse' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/60">
              <div>
                <h4 className="text-xs font-bold text-violet-950 dark:text-violet-200">
                  دانلود قالب اکسل ثبت گروهی کاربران انبار و کارپردازی
                </h4>
                <p className="text-[11px] text-violet-800 dark:text-violet-400 mt-0.5">
                  ستون‌ها: نام و نام خانوادگی، نام کاربری، کلمه عبور، شماره تماس، وضعیت، توضیحات
                </p>
              </div>
              <button
                type="button"
                onClick={downloadWarehouseTemplate}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود قالب اکسل انبار</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 rounded-3xl p-8 text-center transition">
              <UploadCloud className="w-12 h-12 mx-auto text-violet-600 mb-3" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                فایل اکسل کاربران انبار را انتخاب کنید
              </h4>
              <p className="text-xs text-slate-500 mb-4">فرمت‌های مجاز: .xlsx, .xls, .csv (نام کاربری تکراری بروزرسانی می‌شود)</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-violet-600/20">
                <span>انتخاب فایل اکسل انبار</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleWarehouseFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {loading && <div className="text-center text-xs text-violet-600 font-bold">در حال پردازش فایل اکسل انبار...</div>}

            {previewWarehouse && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      پیش‌نمایش: {previewWarehouse.list.length} کاربر انبار آماده ثبت
                    </span>
                  </div>
                  {previewWarehouse.skippedRows > 0 && (
                    <span className="text-[11px] text-amber-600 font-semibold">
                      ({previewWarehouse.skippedRows} ردیف خالی نادیده گرفته شد)
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto max-h-60">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">ردیف</th>
                        <th className="p-2.5">نام و نام خانوادگی</th>
                        <th className="p-2.5">نام کاربری</th>
                        <th className="p-2.5">کلمه عبور</th>
                        <th className="p-2.5">شماره تماس</th>
                        <th className="p-2.5">وضعیت</th>
                        <th className="p-2.5">توضیحات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewWarehouse.list.map((wh, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5">{i + 1}</td>
                          <td className="p-2.5 font-bold">{wh.fullName}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{wh.username}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{wh.password}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{wh.mobile || wh.phone}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                wh.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {wh.status === 'active' ? 'فعال' : 'غیرفعال'}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-500">{wh.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceMode}
                      onChange={(e) => setReplaceMode(e.target.checked)}
                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-4 h-4"
                    />
                    <span>جایگزینی کامل لیست کاربران انبار قبلی</span>
                  </label>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSaveWarehouse}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    تأیید و ثبت کاربران انبار در سامانه ابری
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
