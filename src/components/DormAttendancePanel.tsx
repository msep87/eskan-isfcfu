import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AppSettings,
  Bed,
  DormAttendanceLogEntry,
  DormAttendanceScanDirection,
  DormAttendanceStateRecord,
  DormAttendanceStatus,
  Dormitory,
  Room,
  Student,
} from '../types';
import { Storage } from '../utils/storage';
import { getStudentResidenceType } from '../utils/financeUtils';
import { formatJalaliDate, getTodayJalali } from '../utils/jalaliCalendar';
import { normSearchText } from '../utils/studentSearchSort';
import {
  DORM_ATTENDANCE_STATUS_META,
  buildCode128SvgMarkup,
  findStudentByScannedBarcode,
  generateQrCodeDataUrl,
  getEffectiveDormAttendanceStatus,
  getStudentCardBarcodeValue,
  getStudentCardQrPayload,
  playBarcodeScanTone,
  toAsciiDigits,
} from '../utils/dormBarcodeUtils';
import {
  AlertCircle,
  ArrowLeftRight,
  Barcode,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSpreadsheet,
  History,
  LogIn,
  LogOut,
  Printer,
  QrCode,
  RotateCcw,
  ScanLine,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserMinus,
  Users,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from 'lucide-react';

interface DormAttendancePanelProps {
  mode: 'admin' | 'supervisor';
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  settings: AppSettings;
  actor: { id: string; name: string };
  allowedDormIds?: string[];
  onOpenStudentCard?: (student: Student) => void;
  onAttendanceUpdated?: () => void;
}

type AttendanceSubTab = 'roster' | 'dorm_breakdown' | 'logs';

interface LastScanBannerState {
  kind: 'success' | 'warning' | 'error';
  title: string;
  subtitle: string;
  student?: Student;
  previousStatus?: DormAttendanceStatus;
  nextStatus?: DormAttendanceStatus;
  scannedCode?: string;
  timeLabel?: string;
}

interface BatchCardItem {
  student: Student;
  dormName: string;
  roomNumber: string;
  bedLabel: string;
  barcodeValue: string;
  barcodeSvgHtml: string;
  qrDataUrl: string;
}

const getNowTimeLabel = (): string => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const getTodayJalaliStr = (): string => {
  const t = getTodayJalali();
  return formatJalaliDate(t.jy, t.jm, t.jd, 'en');
};

export const DormAttendancePanel: React.FC<DormAttendancePanelProps> = ({
  mode,
  dorms,
  rooms,
  beds,
  students,
  settings,
  actor,
  allowedDormIds,
  onOpenStudentCard,
  onAttendanceUpdated,
}) => {
  const [subTab, setSubTab] = useState<AttendanceSubTab>('roster');
  const [attendanceStates, setAttendanceStates] = useState<DormAttendanceStateRecord[]>(() =>
    Storage.getDormAttendanceStates()
  );
  const [attendanceLogs, setAttendanceLogs] = useState<DormAttendanceLogEntry[]>(() =>
    Storage.getDormAttendanceLogs()
  );

  // فیلترها و تنظیمات اسکنر بارکد
  const [selectedDormId, setSelectedDormId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DormAttendanceStatus>('all');
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [showAllRows, setShowAllRows] = useState<boolean>(false);

  const [scanInput, setScanInput] = useState<string>('');
  const [scanDirection, setScanDirection] = useState<DormAttendanceScanDirection>('auto_toggle');
  const [leaveUntilDraft, setLeaveUntilDraft] = useState<string>('');
  const [leaveNoteDraft, setLeaveNoteDraft] = useState<string>('');
  const [scannerAutoFocus, setScannerAutoFocus] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastScanBanner, setLastScanBanner] = useState<LastScanBannerState | null>(null);

  // مودال ثبت مرخصی دستی یا بازنشانی گروهی
  const [leaveTargetStudent, setLeaveTargetStudent] = useState<Student | null>(null);
  const [modalLeaveUntil, setModalLeaveUntil] = useState<string>('');
  const [modalLeaveNote, setModalLeaveNote] = useState<string>('');
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);

  // مودال چاپ دسته‌جمعی بارکد و QR کارت‌های سرا
  const [batchPrintOpen, setBatchPrintOpen] = useState<boolean>(false);
  const [batchPrintItems, setBatchPrintItems] = useState<BatchCardItem[]>([]);
  const [batchPrintPreparing, setBatchPrintPreparing] = useState<boolean>(false);

  // جستجوی تاریخچه تردد
  const [logSearch, setLogSearch] = useState<string>('');
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | DormAttendanceStatus>('all');
  const [showOnlyAbnormalRooms, setShowOnlyAbnormalRooms] = useState<boolean>(false);

  const scannerInputRef = useRef<HTMLInputElement>(null);
  const lastAutoScanRef = useRef<{ studentId: string; ts: number } | null>(null);
  const globalScanBufferRef = useRef<{ text: string; lastTs: number }>({ text: '', lastTs: 0 });

  const scopedDorms = useMemo(() => {
    if (allowedDormIds && allowedDormIds.length > 0) {
      const idSet = new Set(allowedDormIds);
      return dorms.filter((d) => idSet.has(d.id));
    }
    return dorms;
  }, [dorms, allowedDormIds]);

  const scopedDormIdSet = useMemo(
    () => new Set(scopedDorms.map((d) => d.id)),
    [scopedDorms]
  );

  const dormMap = useMemo(() => new Map(dorms.map((d) => [d.id, d])), [dorms]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const bedMap = useMemo(() => new Map(beds.map((b) => [b.id, b])), [beds]);

  // دانشجویان خوابگاهی ساکن سراهای تحت پوشش (حالت پیش‌فرض همه = حاضر در سرا)
  const dormResidents = useMemo(() => {
    return students.filter((s) => {
      if (getStudentResidenceType(s) !== 'dormitory') return false;
      if (!s.assignedDormId) return false;
      if (allowedDormIds && allowedDormIds.length > 0 && !scopedDormIdSet.has(s.assignedDormId)) {
        return false;
      }
      return true;
    });
  }, [students, allowedDormIds, scopedDormIdSet]);

  const statesMap = useMemo(() => {
    const map = new Map<string, DormAttendanceStateRecord>();
    attendanceStates.forEach((st) => {
      map.set(st.studentId, st);
    });
    return map;
  }, [attendanceStates]);

  const activeScopeResidents = useMemo(() => {
    if (selectedDormId === 'all') return dormResidents;
    return dormResidents.filter((s) => s.assignedDormId === selectedDormId);
  }, [dormResidents, selectedDormId]);

  const kpiStats = useMemo(() => {
    let present = 0;
    let out = 0;
    let leave = 0;
    let absent = 0;
    activeScopeResidents.forEach((st) => {
      const status = getEffectiveDormAttendanceStatus(st.studentId, statesMap);
      if (status === 'present') present += 1;
      else if (status === 'out') out += 1;
      else if (status === 'leave') leave += 1;
      else absent += 1;
    });
    const total = activeScopeResidents.length;
    const presentPct = total > 0 ? Math.round((present / total) * 100) : 100;
    return { total, present, out, leave, absent, presentPct };
  }, [activeScopeResidents, statesMap]);

  const dormBreakdownRows = useMemo(() => {
    return scopedDorms.map((d) => {
      const residents = dormResidents.filter((s) => s.assignedDormId === d.id);
      let present = 0;
      let out = 0;
      let leave = 0;
      let absent = 0;
      residents.forEach((s) => {
        const status = getEffectiveDormAttendanceStatus(s.studentId, statesMap);
        if (status === 'present') present += 1;
        else if (status === 'out') out += 1;
        else if (status === 'leave') leave += 1;
        else absent += 1;
      });
      return {
        dorm: d,
        total: residents.length,
        present,
        out,
        leave,
        absent,
      };
    });
  }, [scopedDorms, dormResidents, statesMap]);

  const roomBreakdownRows = useMemo(() => {
    const targetRooms =
      selectedDormId === 'all'
        ? rooms.filter((r) => scopedDormIdSet.has(r.dormId))
        : rooms.filter((r) => r.dormId === selectedDormId);

    const byRoomId = new Map<string, Student[]>();
    activeScopeResidents.forEach((s) => {
      if (!s.assignedRoomId) return;
      const list = byRoomId.get(s.assignedRoomId) || [];
      list.push(s);
      byRoomId.set(s.assignedRoomId, list);
    });

    return targetRooms
      .map((room) => {
        const occs = byRoomId.get(room.id) || [];
        let present = 0;
        let out = 0;
        let leave = 0;
        let absent = 0;
        occs.forEach((s) => {
          const st = getEffectiveDormAttendanceStatus(s.studentId, statesMap);
          if (st === 'present') present += 1;
          else if (st === 'out') out += 1;
          else if (st === 'leave') leave += 1;
          else absent += 1;
        });
        return {
          room,
          dormName: dormMap.get(room.dormId)?.name || 'سرا',
          occupants: occs,
          total: occs.length,
          present,
          out,
          leave,
          absent,
        };
      })
      .filter((row) => row.total > 0)
      .filter((row) => !showOnlyAbnormalRooms || row.out > 0 || row.leave > 0 || row.absent > 0)
      .sort((a, b) => {
        if (a.dormName !== b.dormName) return a.dormName.localeCompare(b.dormName, 'fa');
        return a.room.roomNumber.localeCompare(b.room.roomNumber, 'fa', { numeric: true });
      });
  }, [
    rooms,
    selectedDormId,
    scopedDormIdSet,
    activeScopeResidents,
    statesMap,
    dormMap,
    showOnlyAbnormalRooms,
  ]);

  const filteredRosterStudents = useMemo(() => {
    const q = normSearchText(searchQuery);
    const rf = toAsciiDigits(roomFilter).trim().toLowerCase();
    return activeScopeResidents
      .filter((st) => {
        const effectiveStatus = getEffectiveDormAttendanceStatus(st.studentId, statesMap);
        if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false;
        const roomNum = st.assignedRoomId ? roomMap.get(st.assignedRoomId)?.roomNumber || '' : '';
        if (rf && !toAsciiDigits(roomNum).toLowerCase().includes(rf)) return false;
        if (!q) return true;
        const dormName = dormMap.get(st.assignedDormId || '')?.name || '';
        const haystack = normSearchText(
          `${st.fullName} ${st.studentId} ${st.nationalId} ${st.fieldOfStudy} ${dormName} ${roomNum}`
        );
        return haystack.includes(q);
      })
      .sort((a, b) => {
        const order: Record<DormAttendanceStatus, number> = {
          absent: 0,
          out: 1,
          leave: 2,
          present: 3,
        };
        const sa = order[getEffectiveDormAttendanceStatus(a.studentId, statesMap)];
        const sb = order[getEffectiveDormAttendanceStatus(b.studentId, statesMap)];
        if (sa !== sb) return sa - sb;
        return a.fullName.localeCompare(b.fullName, 'fa');
      });
  }, [activeScopeResidents, statesMap, statusFilter, roomFilter, searchQuery, roomMap, dormMap]);

  useEffect(() => {
    setPage(1);
  }, [selectedDormId, statusFilter, roomFilter, searchQuery]);

  const filteredLogs = useMemo(() => {
    const q = normSearchText(logSearch);
    return attendanceLogs.filter((lg) => {
      if (allowedDormIds && allowedDormIds.length > 0 && lg.dormId && !scopedDormIdSet.has(lg.dormId)) {
        return false;
      }
      if (selectedDormId !== 'all' && lg.dormId !== selectedDormId) return false;
      if (logStatusFilter !== 'all' && lg.nextStatus !== logStatusFilter) return false;
      if (!q) return true;
      const hay = normSearchText(
        `${lg.studentName} ${lg.studentId} ${lg.nationalId} ${lg.dormName} ${lg.roomNumber || ''} ${lg.actionLabel} ${lg.actorName} ${lg.note || ''}`
      );
      return hay.includes(q);
    });
  }, [attendanceLogs, allowedDormIds, scopedDormIdSet, selectedDormId, logStatusFilter, logSearch]);

  const reloadAttendanceFromStorage = () => {
    setAttendanceStates(Storage.getDormAttendanceStates());
    setAttendanceLogs(Storage.getDormAttendanceLogs());
    onAttendanceUpdated?.();
  };

  useEffect(() => {
    if (scannerAutoFocus && subTab === 'roster' && !leaveTargetStudent && !confirmResetOpen && !batchPrintOpen) {
      scannerInputRef.current?.focus();
    }
  }, [scannerAutoFocus, subTab, leaveTargetStudent, confirmResetOpen, batchPrintOpen]);

  const applyAttendanceChange = (params: {
    student: Student;
    nextStatus: DormAttendanceStatus;
    method: 'barcode_scanner' | 'manual';
    scannedCode?: string;
    actionLabel: string;
    leaveUntilDate?: string;
    note?: string;
  }) => {
    const dormName = dormMap.get(params.student.assignedDormId || '')?.name || 'سرای دانشجویی';
    const roomNumber = params.student.assignedRoomId
      ? roomMap.get(params.student.assignedRoomId)?.roomNumber
      : undefined;
    const bedLabel = params.student.assignedBedId
      ? bedMap.get(params.student.assignedBedId)?.label
      : undefined;

    const timeLabel = getNowTimeLabel();
    const jalaliDate = getTodayJalaliStr();

    const result = Storage.recordDormAttendanceChange({
      student: params.student,
      dormName,
      roomNumber,
      bedLabel,
      nextStatus: params.nextStatus,
      method: params.method,
      scannedCode: params.scannedCode,
      actionLabel: params.actionLabel,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: mode,
      jalaliDate,
      timeLabel,
      leaveUntilDate: params.leaveUntilDate,
      note: params.note,
    });

    reloadAttendanceFromStorage();
    if (soundEnabled) playBarcodeScanTone('success');

    setLastScanBanner({
      kind: 'success',
      title: `${params.actionLabel} برای «${params.student.fullName}» ثبت شد`,
      subtitle: `${dormName}${roomNumber ? ` · اتاق ${roomNumber}` : ''}${
        bedLabel ? ` · ${bedLabel}` : ''
      } (ساعت ${timeLabel})`,
      student: params.student,
      previousStatus: result.previousStatus,
      nextStatus: params.nextStatus,
      scannedCode: params.scannedCode,
      timeLabel,
    });
  };

  const processBarcodeScan = (rawCode: string) => {
    const trimmed = (rawCode || '').trim();
    if (!trimmed) return;

    const { student: matchedInScope, normalizedCode } = findStudentByScannedBarcode(
      trimmed,
      dormResidents
    );

    if (!matchedInScope) {
      const { student: matchedGlobal } = findStudentByScannedBarcode(trimmed, students);
      if (soundEnabled) playBarcodeScanTone('error');

      if (matchedGlobal) {
        const resType = getStudentResidenceType(matchedGlobal);
        setLastScanBanner({
          kind: 'error',
          title: `کارت شناسایی شد اما جزو ساکنان این محدوده نیست: ${matchedGlobal.fullName}`,
          subtitle:
            resType !== 'dormitory'
              ? 'این دانشجو «ترددی (غیرخوابگاهی)» ثبت شده است.'
              : 'این دانشجو در سراهای تحت مدیریت فعلی یا فاقد اسکان در سرا است.',
          student: matchedGlobal,
          scannedCode: normalizedCode,
          timeLabel: getNowTimeLabel(),
        });
      } else {
        setLastScanBanner({
          kind: 'error',
          title: `بارکد یا کد دانشجویی «${normalizedCode || trimmed}» یافت نشد`,
          subtitle: 'لطفاً کارت خوابگاه معتبر را دوباره مقابل بارکدخوان بگیرید یا کد دانشجویی را بررسی کنید.',
          scannedCode: normalizedCode || trimmed,
          timeLabel: getNowTimeLabel(),
        });
      }
      setScanInput('');
      return;
    }

    const currentStatus = getEffectiveDormAttendanceStatus(matchedInScope.studentId, statesMap);
    const nowTs = Date.now();
    if (
      scanDirection === 'auto_toggle' &&
      lastAutoScanRef.current &&
      lastAutoScanRef.current.studentId === matchedInScope.studentId &&
      nowTs - lastAutoScanRef.current.ts < 5000
    ) {
      if (soundEnabled) playBarcodeScanTone('warning');
      setLastScanBanner({
        kind: 'warning',
        title: `اسکن تکراری برای «${matchedInScope.fullName}» نادیده گرفته شد`,
        subtitle: `این کارت همین لحظه ثبت شده است (وضعیت فعلی: ${DORM_ATTENDANCE_STATUS_META[currentStatus].label}).`,
        student: matchedInScope,
        previousStatus: currentStatus,
        nextStatus: currentStatus,
        scannedCode: normalizedCode,
        timeLabel: getNowTimeLabel(),
      });
      setScanInput('');
      return;
    }

    let nextStatus: DormAttendanceStatus = 'present';
    let actionLabel = '';
    if (scanDirection === 'auto_toggle') {
      nextStatus = currentStatus === 'present' ? 'out' : 'present';
      actionLabel =
        nextStatus === 'out'
          ? 'ثبت خروج از سرا (اسکن بارکد)'
          : 'ثبت ورود به سرا (اسکن بارکد)';
      lastAutoScanRef.current = { studentId: matchedInScope.studentId, ts: nowTs };
    } else if (scanDirection === 'check_in') {
      nextStatus = 'present';
      actionLabel = 'ثبت ورود و حضور در سرا (اسکن بارکد)';
    } else if (scanDirection === 'check_out') {
      nextStatus = 'out';
      actionLabel = 'ثبت خروج از سرا (اسکن بارکد)';
    } else if (scanDirection === 'leave_out') {
      nextStatus = 'leave';
      actionLabel = 'ثبت مرخصی با اسکن بارکد';
    } else {
      nextStatus = 'absent';
      actionLabel = 'ثبت غیبت با اسکن بارکد';
    }

    applyAttendanceChange({
      student: matchedInScope,
      nextStatus,
      method: 'barcode_scanner',
      scannedCode: normalizedCode,
      actionLabel,
      leaveUntilDate: scanDirection === 'leave_out' ? leaveUntilDraft.trim() || undefined : undefined,
      note: scanDirection === 'leave_out' ? leaveNoteDraft.trim() || undefined : undefined,
    });
    setScanInput('');
  };

  // دریافت اسکن بارکدخوان حتی زمانی که نشانگر از کادر خارج شده باشد
  useEffect(() => {
    if (!scannerAutoFocus || subTab !== 'roster' || leaveTargetStudent || confirmResetOpen || batchPrintOpen) {
      return;
    }
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const now = Date.now();
      if (now - globalScanBufferRef.current.lastTs > 350) {
        globalScanBufferRef.current.text = '';
      }

      if (e.key === 'Enter') {
        const buf = globalScanBufferRef.current.text.trim();
        globalScanBufferRef.current.text = '';
        if (buf.length >= 4) {
          e.preventDefault();
          processBarcodeScan(buf);
        }
        return;
      }

      if (e.key.length === 1) {
        globalScanBufferRef.current.text += e.key;
        globalScanBufferRef.current.lastTs = now;
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  });

  const handleManualStatusClick = (st: Student, nextStatus: DormAttendanceStatus) => {
    if (nextStatus === 'leave') {
      setLeaveTargetStudent(st);
      const existing = statesMap.get(st.studentId);
      setModalLeaveUntil(existing?.leaveUntilDate || '');
      setModalLeaveNote(existing?.note || '');
      return;
    }
    const labelMap: Record<Exclude<DormAttendanceStatus, 'leave'>, string> = {
      present: 'ثبت دستی حضور در سرا',
      out: 'ثبت دستی خروج از سرا',
      absent: 'ثبت دستی غیبت / تأخیر',
    };
    applyAttendanceChange({
      student: st,
      nextStatus,
      method: 'manual',
      actionLabel: labelMap[nextStatus],
    });
  };

  const handleConfirmModalLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTargetStudent) return;
    applyAttendanceChange({
      student: leaveTargetStudent,
      nextStatus: 'leave',
      method: 'manual',
      actionLabel: 'ثبت مرخصی دانشجو',
      leaveUntilDate: modalLeaveUntil.trim() || undefined,
      note: modalLeaveNote.trim() || undefined,
    });
    setLeaveTargetStudent(null);
    setModalLeaveUntil('');
    setModalLeaveNote('');
  };

  const handleExecuteResetToDefault = () => {
    const dormNameMap = new Map(dorms.map((d) => [d.id, d.name]));
    const roomNumberMap = new Map(rooms.map((r) => [r.id, r.roomNumber]));
    const scopeLabel =
      selectedDormId === 'all'
        ? mode === 'admin'
          ? 'کل سراهای دانشگاه'
          : 'سراهای تحت سرپرستی'
        : dormMap.get(selectedDormId)?.name || 'سرا';

    const changedCount = Storage.resetDormAttendanceToDefault({
      students: activeScopeResidents,
      dormMap: dormNameMap,
      roomMap: roomNumberMap,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: mode,
      jalaliDate: getTodayJalaliStr(),
      timeLabel: getNowTimeLabel(),
      dormScopeLabel: scopeLabel,
    });

    reloadAttendanceFromStorage();
    setConfirmResetOpen(false);
    if (soundEnabled) playBarcodeScanTone('success');
    setLastScanBanner({
      kind: 'success',
      title: `وضعیت حضور ساکنین «${scopeLabel}» به حالت پیش‌فرض (حاضر در سرا) بازنشانی شد`,
      subtitle: `${changedCount.toLocaleString('fa-IR')} تغییر وضعیت ثبت و در دفترچه تردد ذخیره گردید.`,
      timeLabel: getNowTimeLabel(),
    });
  };

  const handleExportRosterExcel = () => {
    const rows = filteredRosterStudents.map((st, idx) => {
      const stateRec = statesMap.get(st.studentId);
      const eff = stateRec?.status || 'present';
      const dName = dormMap.get(st.assignedDormId || '')?.name || '—';
      const rNum = st.assignedRoomId ? roomMap.get(st.assignedRoomId)?.roomNumber || '—' : '—';
      const bLabel = st.assignedBedId ? bedMap.get(st.assignedBedId)?.label || '—' : '—';
      return {
        ردیف: idx + 1,
        'کد بارکد / دانشجویی': getStudentCardBarcodeValue(st),
        'نام و نام خانوادگی': st.fullName,
        'کد ملی': st.nationalId,
        'سرای محل اسکان': dName,
        اتاق: rNum,
        تخت: bLabel,
        'وضعیت حضور': DORM_ATTENDANCE_STATUS_META[eff].label,
        'تاریخ آخرین تغییر': stateRec ? stateRec.lastJalaliDate : 'پیش‌فرض (حاضر)',
        'ساعت آخرین تغییر': stateRec ? stateRec.lastTimeLabel : '—',
        'تا تاریخ مرخصی': stateRec?.leaveUntilDate || '—',
        'توضیحات / ثبت‌کننده': stateRec
          ? `${stateRec.updatedByName}${stateRec.note ? ` — ${stateRec.note}` : ''}`
          : 'پیش‌فرض سامانه',
      };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'آمار_حضور_سرا');
    XLSX.writeFile(wb, `آمار_حضور_خوابگاهی_${getTodayJalaliStr().replace(/\//g, '-')}.xlsx`);
  };

  const handleExportLogsExcel = () => {
    const rows = filteredLogs.map((lg, idx) => ({
      ردیف: idx + 1,
      تاریخ: lg.jalaliDate,
      ساعت: lg.timeLabel,
      'نام دانشجو': lg.studentName,
      'شماره دانشجویی': lg.studentId,
      'کد ملی': lg.nationalId,
      سرا: lg.dormName,
      اتاق: lg.roomNumber || '—',
      'وضعیت قبلی': DORM_ATTENDANCE_STATUS_META[lg.previousStatus].label,
      'وضعیت جدید': DORM_ATTENDANCE_STATUS_META[lg.nextStatus].label,
      عملیات: lg.actionLabel,
      روش:
        lg.method === 'barcode_scanner'
          ? 'اسکن بارکد'
          : lg.method === 'batch_reset'
          ? 'بازنشانی گروهی'
          : 'ثبت دستی',
      'کد اسکن‌شده': lg.scannedCode || '—',
      'ثبت‌کننده': lg.actorName,
      'توضیح / تا تاریخ': [lg.leaveUntilDate ? `تا ${lg.leaveUntilDate}` : '', lg.note || '']
        .filter(Boolean)
        .join(' — ') || '—',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'تردد_بارکدی');
    XLSX.writeFile(wb, `گزارش_تردد_بارکدی_${getTodayJalaliStr().replace(/\//g, '-')}.xlsx`);
  };

  const handleOpenBatchBarcodePrint = async () => {
    const targetStudents = filteredRosterStudents.slice(0, 120);
    if (targetStudents.length === 0) return;
    setBatchPrintPreparing(true);
    setBatchPrintOpen(true);
    try {
      const prepared: BatchCardItem[] = await Promise.all(
        targetStudents.map(async (st) => {
          const barcodeVal = getStudentCardBarcodeValue(st);
          const qrUrl = await generateQrCodeDataUrl(getStudentCardQrPayload(st), 110).catch(
            () => ''
          );
          const svgMarkup = buildCode128SvgMarkup(barcodeVal, {
            width: 1.25,
            height: 24,
            margin: 3,
          });
          return {
            student: st,
            dormName: dormMap.get(st.assignedDormId || '')?.name || 'سرا',
            roomNumber: st.assignedRoomId
              ? roomMap.get(st.assignedRoomId)?.roomNumber || '---'
              : '---',
            bedLabel: st.assignedBedId ? bedMap.get(st.assignedBedId)?.label || 'تخت' : 'تخت',
            barcodeValue: barcodeVal,
            barcodeSvgHtml: svgMarkup,
            qrDataUrl: qrUrl,
          };
        })
      );
      setBatchPrintItems(prepared);
    } finally {
      setBatchPrintPreparing(false);
    }
  };

  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(filteredRosterStudents.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRoster = showAllRows
    ? filteredRosterStudents
    : filteredRosterStudents.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* هدر اصلی بخش حضور و غیاب */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20 shrink-0">
            <ScanLine className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                سامانه حضور و غیاب بارکدی و آمار لحظه‌ای ساکنان سراها
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                حالت پیش‌فرض: همه ساکنان حاضر در سرا
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              کارت خوابگاه دانشجو را با دستگاه بارکدخوان (USB/بی‌سیم) یا اسکنر QR بخوانید تا وضعیت ورود، خروج، مرخصی یا غیبت بلافاصله ثبت و آمار سراها به‌صورت برخط به‌روزرسانی شود.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {scopedDorms.length > 1 && (
            <select
              value={selectedDormId}
              onChange={(e) => setSelectedDormId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-extrabold"
            >
              <option value="all">همه سراهای تحت پوشش ({dormResidents.length} دانشجو)</option>
              {scopedDorms.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={handleExportRosterExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>خروجی اکسل آمار</span>
          </button>
          <button
            type="button"
            onClick={() => void handleOpenBatchBarcodePrint()}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ برگه بارکددار سرا</span>
          </button>
        </div>
      </div>

      {/* کارت‌های آمار لحظه‌ای */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('all');
            setSubTab('roster');
          }}
          className={`text-right rounded-2xl p-4 border transition cursor-pointer ${
            statusFilter === 'all' && subTab === 'roster'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-800 dark:border-teal-500 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs opacity-80 font-bold">
            <span>کل ساکنان خوابگاهی</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black mt-2 tabular-nums">
            {kpiStats.total.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] opacity-75 mt-0.5">نفر در محدوده انتخابی</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('present');
            setSubTab('roster');
          }}
          className={`text-right rounded-2xl p-4 border transition cursor-pointer ${
            statusFilter === 'present'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span>حاضر در سرا (پیش‌فرض)</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black mt-2 tabular-nums">
            {kpiStats.present.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] opacity-85 mt-0.5">
            {kpiStats.presentPct.toLocaleString('fa-IR')}٪ ساکنین هم‌اکنون در سرا
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('out');
            setSubTab('roster');
          }}
          className={`text-right rounded-2xl p-4 border transition cursor-pointer ${
            statusFilter === 'out'
              ? 'bg-sky-600 text-white border-sky-600 shadow-md'
              : 'bg-sky-50/70 dark:bg-sky-950/25 border-sky-200 dark:border-sky-800/80 text-sky-900 dark:text-sky-200 hover:border-sky-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span>خارج از سرا (تردد)</span>
            <LogOut className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black mt-2 tabular-nums">
            {kpiStats.out.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] opacity-85 mt-0.5">ثبت خروج با کارت/دستی</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('leave');
            setSubTab('roster');
          }}
          className={`text-right rounded-2xl p-4 border transition cursor-pointer ${
            statusFilter === 'leave'
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
              : 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span>در مرخصی مجاز</span>
            <CalendarClock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black mt-2 tabular-nums">
            {kpiStats.leave.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] opacity-85 mt-0.5">دارای مرخصی ثبت‌شده</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('absent');
            setSubTab('roster');
          }}
          className={`text-right rounded-2xl p-4 border transition cursor-pointer ${
            statusFilter === 'absent'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span>غایب / تأخیر شبانه</span>
            <UserMinus className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black mt-2 tabular-nums">
            {kpiStats.absent.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] opacity-85 mt-0.5">نیازمند پیگیری سرپرست</div>
        </button>
      </div>

      {/* ایستگاه اسکن سریع بارکدخوان */}
      <div className="bg-gradient-to-l from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-teal-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                ایستگاه اسکن بارکد کارت خوابگاه دانشجو
              </h3>
              <p className="text-[11px] text-teal-200/85">
                اسکنر USB یا بی‌سیم را مقابل کارت خوابگاه بگیرید (پشتیبانی از بارکد ۱بعدی Code-128، کد QR و شماره دانشجویی/کد ملی)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setScannerAutoFocus((v) => !v);
                if (!scannerAutoFocus) scannerInputRef.current?.focus();
              }}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer inline-flex items-center gap-1.5 ${
                scannerAutoFocus
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>{scannerAutoFocus ? 'دریافت خودکار اسکنر فعال' : 'فوکوس دستی'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer inline-flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-teal-500/20 border-teal-400/50 text-teal-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'صدای بیپ روشن' : 'بی‌صدا'}</span>
            </button>
          </div>
        </div>

        {/* انتخاب حالت عملکرد اسکنر */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
          {(
            [
              {
                key: 'auto_toggle',
                label: 'تردد خودکار (ورود ↔ خروج)',
                icon: ArrowLeftRight,
                activeCls: 'bg-teal-500 text-slate-950 border-teal-400',
              },
              {
                key: 'check_out',
                label: 'فقط ثبت خروج از سرا',
                icon: LogOut,
                activeCls: 'bg-sky-500 text-white border-sky-400',
              },
              {
                key: 'check_in',
                label: 'فقط ثبت ورود (حاضر)',
                icon: LogIn,
                activeCls: 'bg-emerald-500 text-slate-950 border-emerald-400',
              },
              {
                key: 'leave_out',
                label: 'ثبت مرخصی با اسکن',
                icon: CalendarClock,
                activeCls: 'bg-amber-400 text-slate-950 border-amber-300',
              },
              {
                key: 'mark_absent',
                label: 'ثبت غیبت با اسکن',
                icon: UserMinus,
                activeCls: 'bg-rose-500 text-white border-rose-400',
              },
            ] as const
          ).map((modeOpt) => {
            const Icon = modeOpt.icon;
            const active = scanDirection === modeOpt.key;
            return (
              <button
                key={modeOpt.key}
                type="button"
                onClick={() => {
                  setScanDirection(modeOpt.key);
                  scannerInputRef.current?.focus();
                }}
                className={`px-3 py-1.5 rounded-xl border transition inline-flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? modeOpt.activeCls
                    : 'bg-white/10 border-white/15 text-teal-100 hover:bg-white/15'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{modeOpt.label}</span>
              </button>
            );
          })}
        </div>

        {scanDirection === 'leave_out' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-amber-500/10 border border-amber-400/30 p-3 rounded-2xl text-xs">
            <label className="space-y-1">
              <span className="font-bold text-amber-200 block">تا تاریخ مرخصی (اختیاری):</span>
              <input
                type="text"
                value={leaveUntilDraft}
                onChange={(e) => setLeaveUntilDraft(e.target.value)}
                placeholder="مثلاً: 1405/09/15"
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-amber-400/40 text-white font-mono"
                dir="ltr"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-amber-200 block">توضیح مرخصی (اختیاری):</span>
              <input
                type="text"
                value={leaveNoteDraft}
                onChange={(e) => setLeaveNoteDraft(e.target.value)}
                placeholder="مثلاً: مرخصی آخر هفته به مقصد خانواده"
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-amber-400/40 text-white"
              />
            </label>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            processBarcodeScan(scanInput);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <QrCode className="w-5 h-5 text-teal-400 absolute right-3.5 top-3.5" />
            <input
              ref={scannerInputRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="بارکد کارت خوابگاه را اسکن کنید یا شماره دانشجویی / کد ملی را وارد و Enter بزنید..."
              className="w-full pr-11 pl-4 py-3 rounded-2xl bg-white text-slate-900 font-mono font-black text-sm shadow-inner border-2 border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/30 placeholder:font-sans placeholder:font-medium placeholder:text-slate-400"
              dir="auto"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm inline-flex items-center justify-center gap-2 shadow-lg cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ثبت اسکن</span>
          </button>
        </form>

        {/* بنر نتیجه آخرین اسکن */}
        {lastScanBanner && (
          <div
            className={`rounded-2xl p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              lastScanBanner.kind === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-50'
                : lastScanBanner.kind === 'warning'
                ? 'bg-amber-500/15 border-amber-400/40 text-amber-50'
                : 'bg-rose-500/20 border-rose-400/50 text-rose-50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {lastScanBanner.student ? (
                lastScanBanner.student.photoUrl ? (
                  <img
                    src={lastScanBanner.student.photoUrl}
                    alt={lastScanBanner.student.fullName}
                    className="w-11 h-11 rounded-xl object-cover border border-white/30 shrink-0"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white border border-white/30 shrink-0"
                    style={{ backgroundColor: lastScanBanner.student.avatarColor || '#0d9488' }}
                  >
                    <User className="w-5 h-5" />
                  </div>
                )
              ) : (
                <AlertCircle className="w-8 h-8 text-rose-300 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm flex flex-wrap items-center gap-2">
                  <span>{lastScanBanner.title}</span>
                  {lastScanBanner.previousStatus && lastScanBanner.nextStatus && (
                    <span className="px-2 py-0.5 rounded-lg bg-black/30 text-[10.5px] font-bold">
                      {DORM_ATTENDANCE_STATUS_META[lastScanBanner.previousStatus].shortLabel} ←{' '}
                      {DORM_ATTENDANCE_STATUS_META[lastScanBanner.nextStatus].shortLabel}
                    </span>
                  )}
                </div>
                <div className="text-[11px] opacity-85 mt-0.5 truncate">
                  {lastScanBanner.subtitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {lastScanBanner.student && lastScanBanner.kind === 'success' && (
                <>
                  {(['present', 'out', 'leave', 'absent'] as DormAttendanceStatus[]).map((stKey) => (
                    <button
                      key={stKey}
                      type="button"
                      onClick={() =>
                        lastScanBanner.student && handleManualStatusClick(lastScanBanner.student, stKey)
                      }
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                        lastScanBanner.nextStatus === stKey
                          ? 'bg-white text-slate-900 border-white'
                          : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {DORM_ATTENDANCE_STATUS_META[stKey].shortLabel}
                    </button>
                  ))}
                </>
              )}
              <button
                type="button"
                onClick={() => setLastScanBanner(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* تب‌های داخلی بخش حضور و غیاب */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              {
                key: 'roster',
                label: `فهرست وضعیت لحظه‌ای ساکنان (${filteredRosterStudents.length.toLocaleString('fa-IR')})`,
                icon: Users,
              },
              {
                key: 'dorm_breakdown',
                label: `آمار تفکیکی سراها و اتاق‌ها (${dormBreakdownRows.length.toLocaleString('fa-IR')})`,
                icon: Building2,
              },
              {
                key: 'logs',
                label: `تاریخچه و لاگ اسکن تردد (${filteredLogs.length.toLocaleString('fa-IR')})`,
                icon: History,
              },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = subTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSubTab(t.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer ${
                  active
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setConfirmResetOpen(true)}
          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>بازنشانی همه به «حاضر در سرا»</span>
        </button>
      </div>

      {/* ۱. تب فهرست وضعیت لحظه‌ای دانشجویان */}
      {subTab === 'roster' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام دانشجو، شماره دانشجویی، کد ملی یا رشته..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <input
              type="text"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              placeholder="فیلتر شماره اتاق..."
              className="w-36 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | DormAttendanceStatus)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold"
            >
              <option value="all">همه وضعیت‌ها ({kpiStats.total})</option>
              <option value="present">فقط حاضر در سرا ({kpiStats.present})</option>
              <option value="out">فقط خارج از سرا ({kpiStats.out})</option>
              <option value="leave">فقط در مرخصی ({kpiStats.leave})</option>
              <option value="absent">فقط غایب / تأخیر ({kpiStats.absent})</option>
            </select>
          </div>

          {visibleRoster.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
              هیچ دانشجوی خوابگاهی مطابق فیلترهای انتخابی یافت نشد.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">دانشجو و کد بارکد</th>
                    <th className="p-3">سرا / اتاق / تخت</th>
                    <th className="p-3">وضعیت لحظه‌ای</th>
                    <th className="p-3">آخرین ثبت / توضیح</th>
                    <th className="p-3 text-center">تغییر سریع وضعیت و کارت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                  {visibleRoster.map((st) => {
                    const stateRec = statesMap.get(st.studentId);
                    const effStatus: DormAttendanceStatus = stateRec?.status || 'present';
                    const meta = DORM_ATTENDANCE_STATUS_META[effStatus];
                    const dormName = dormMap.get(st.assignedDormId || '')?.name || '—';
                    const roomNum = st.assignedRoomId
                      ? roomMap.get(st.assignedRoomId)?.roomNumber || '---'
                      : '---';
                    const bedLbl = st.assignedBedId ? bedMap.get(st.assignedBedId)?.label || '' : '';
                    const barcodeVal = getStudentCardBarcodeValue(st);

                    return (
                      <tr key={st.studentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {st.photoUrl ? (
                              <img
                                src={st.photoUrl}
                                alt={st.fullName}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                                style={{ backgroundColor: st.avatarColor || '#0d9488' }}
                              >
                                {st.fullName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-black text-slate-900 dark:text-white">
                                {st.fullName}
                              </div>
                              <div className="text-[10.5px] text-slate-500 font-mono" dir="ltr">
                                {barcodeVal} · {st.nationalId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{dormName}</div>
                          <div className="text-[10.5px] text-slate-500">
                            اتاق {roomNum}
                            {bedLbl ? ` · ${bedLbl}` : ''}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${meta.badgeClass}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                            <span>{meta.label}</span>
                          </span>
                          {stateRec?.leaveUntilDate && effStatus === 'leave' && (
                            <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold mt-1">
                              تا تاریخ: {stateRec.leaveUntilDate}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300">
                          {stateRec ? (
                            <div className="space-y-0.5">
                              <div className="font-bold">
                                {stateRec.lastJalaliDate} — ساعت {stateRec.lastTimeLabel}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {stateRec.method === 'barcode_scanner' ? 'اسکن بارکد' : 'ثبت دستی'} ·{' '}
                                {stateRec.updatedByName}
                                {stateRec.note ? ` · ${stateRec.note}` : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-semibold">
                              حالت پیش‌فرض (حاضر در سرا)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {(['present', 'out', 'leave', 'absent'] as DormAttendanceStatus[]).map(
                              (stKey) => (
                                <button
                                  key={stKey}
                                  type="button"
                                  onClick={() => handleManualStatusClick(st, stKey)}
                                  className={`px-2 py-1 rounded-lg border text-[10.5px] font-bold transition cursor-pointer ${
                                    effStatus === stKey
                                      ? DORM_ATTENDANCE_STATUS_META[stKey].pillActiveClass
                                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {DORM_ATTENDANCE_STATUS_META[stKey].shortLabel}
                                </button>
                              )
                            )}
                            {onOpenStudentCard && (
                              <button
                                type="button"
                                onClick={() => onOpenStudentCard(st)}
                                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10.5px] font-extrabold inline-flex items-center gap-1 cursor-pointer hover:bg-indigo-100"
                                title="نمایش و چاپ کارت خوابگاه با بارکد واقعی"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>کارت بارکددار</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredRosterStudents.length > pageSize && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <span>
                نمایش{' '}
                <strong>
                  {showAllRows
                    ? `همه ${filteredRosterStudents.length.toLocaleString('fa-IR')}`
                    : `${(((safePage - 1) * pageSize) + 1).toLocaleString('fa-IR')} تا ${Math.min(
                        safePage * pageSize,
                        filteredRosterStudents.length
                      ).toLocaleString('fa-IR')} از ${filteredRosterStudents.length.toLocaleString('fa-IR')}`}
                </strong>{' '}
                دانشجو
              </span>
              <div className="flex items-center gap-1.5">
                {!showAllRows && (
                  <>
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 font-bold cursor-pointer"
                    >
                      قبلی
                    </button>
                    <span className="px-2 font-mono font-bold">
                      {safePage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 font-bold cursor-pointer"
                    >
                      بعدی
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowAllRows((v) => !v)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  {showAllRows ? 'صفحه‌بندی (۵۰تایی)' : 'نمایش همه'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ۲. تب آمار تفکیکی سراها و اتاق‌ها */}
      {subTab === 'dorm_breakdown' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {dormBreakdownRows.map((row) => {
              const pct = row.total > 0 ? Math.round((row.present / row.total) * 100) : 100;
              return (
                <div
                  key={row.dorm.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      <span>{row.dorm.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                      {pct.toLocaleString('fa-IR')}٪ حاضر
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                    {row.total > 0 && (
                      <>
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${(row.present / row.total) * 100}%` }}
                        />
                        <div
                          className="bg-sky-500 h-full"
                          style={{ width: `${(row.out / row.total) * 100}%` }}
                        />
                        <div
                          className="bg-amber-400 h-full"
                          style={{ width: `${(row.leave / row.total) * 100}%` }}
                        />
                        <div
                          className="bg-rose-500 h-full"
                          style={{ width: `${(row.absent / row.total) * 100}%` }}
                        />
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] font-bold">
                    <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200">
                      <div>حاضر</div>
                      <div className="font-black text-sm">{row.present.toLocaleString('fa-IR')}</div>
                    </div>
                    <div className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200">
                      <div>خارج</div>
                      <div className="font-black text-sm">{row.out.toLocaleString('fa-IR')}</div>
                    </div>
                    <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200">
                      <div>مرخصی</div>
                      <div className="font-black text-sm">{row.leave.toLocaleString('fa-IR')}</div>
                    </div>
                    <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200">
                      <div>غایب</div>
                      <div className="font-black text-sm">{row.absent.toLocaleString('fa-IR')}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                وضعیت لحظه‌ای اتاق به اتاق ({roomBreakdownRows.length.toLocaleString('fa-IR')} اتاق)
              </h3>
              <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyAbnormalRooms}
                  onChange={(e) => setShowOnlyAbnormalRooms(e.target.checked)}
                  className="rounded accent-teal-600"
                />
                <span>فقط نمایش اتاق‌های دارای خروج، مرخصی یا غایب</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {roomBreakdownRows.map((rb) => (
                <div
                  key={rb.room.id}
                  className={`p-3 rounded-2xl border text-xs space-y-2 ${
                    rb.absent > 0
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                      : rb.out > 0 || rb.leave > 0
                      ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white">
                      {rb.dormName} — اتاق {rb.room.roomNumber}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      {rb.present}/{rb.total} حاضر
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {rb.occupants.map((occ) => {
                      const st = getEffectiveDormAttendanceStatus(occ.studentId, statesMap);
                      return (
                        <button
                          key={occ.studentId}
                          type="button"
                          onClick={() => handleManualStatusClick(occ, st === 'present' ? 'out' : 'present')}
                          title={`کلیک برای جابجایی سریع وضعیت ${occ.fullName}`}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border cursor-pointer ${DORM_ATTENDANCE_STATUS_META[st].badgeClass}`}
                        >
                          {occ.fullName} ({DORM_ATTENDANCE_STATUS_META[st].shortLabel})
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ۳. تب تاریخچه و لاگ ترددهای ثبت‌شده */}
      {subTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="جستجو در تاریخچه تردد..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value as 'all' | DormAttendanceStatus)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              >
                <option value="all">همه رویدادها</option>
                <option value="present">ثبت ورود / حاضر</option>
                <option value="out">ثبت خروج</option>
                <option value="leave">ثبت مرخصی</option>
                <option value="absent">ثبت غیبت</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleExportLogsExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>خروجی اکسل تاریخچه</span>
            </button>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
              هنوز هیچ رویداد اسکن یا تغییر وضعیتی ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[520px]">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 dark:bg-slate-800/80 font-extrabold sticky top-0 z-10">
                  <tr>
                    <th className="p-3">زمان</th>
                    <th className="p-3">دانشجو</th>
                    <th className="p-3">سرا / اتاق</th>
                    <th className="p-3">تغییر وضعیت</th>
                    <th className="p-3">روش و کد</th>
                    <th className="p-3">ثبت‌کننده</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                  {filteredLogs.slice(0, 300).map((lg) => (
                    <tr key={lg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-[11px]">
                        <div className="font-bold">{lg.jalaliDate}</div>
                        <div className="text-slate-500">{lg.timeLabel}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{lg.studentName}</div>
                        <div className="text-[10.5px] text-slate-500 font-mono" dir="ltr">
                          {lg.studentId}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>{lg.dormName}</div>
                        {lg.roomNumber && (
                          <div className="text-[10.5px] text-slate-500">اتاق {lg.roomNumber}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${DORM_ATTENDANCE_STATUS_META[lg.previousStatus].badgeClass}`}
                          >
                            {DORM_ATTENDANCE_STATUS_META[lg.previousStatus].shortLabel}
                          </span>
                          <span>←</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${DORM_ATTENDANCE_STATUS_META[lg.nextStatus].badgeClass}`}
                          >
                            {DORM_ATTENDANCE_STATUS_META[lg.nextStatus].shortLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {lg.actionLabel}
                          {lg.leaveUntilDate ? ` (تا ${lg.leaveUntilDate})` : ''}
                          {lg.note ? ` · ${lg.note}` : ''}
                        </div>
                      </td>
                      <td className="p-3 text-[11px]">
                        <span className="font-bold">
                          {lg.method === 'barcode_scanner'
                            ? 'اسکن بارکد'
                            : lg.method === 'batch_reset'
                            ? 'بازنشانی گروهی'
                            : 'ثبت دستی'}
                        </span>
                        {lg.scannedCode && (
                          <div className="font-mono text-[10px] text-slate-500" dir="ltr">
                            {lg.scannedCode}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-[11px] font-bold">{lg.actorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* مودال ثبت مرخصی با تاریخ و توضیح */}
      {leaveTargetStudent && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-amber-300 dark:border-amber-800 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-amber-500" />
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  ثبت مرخصی برای {leaveTargetStudent.fullName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setLeaveTargetStudent(null)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmModalLeave} className="space-y-3">
              <label className="block space-y-1">
                <span className="font-bold">تاریخ بازگشت پیش‌بینی‌شده (اختیاری)</span>
                <input
                  type="text"
                  value={modalLeaveUntil}
                  onChange={(e) => setModalLeaveUntil(e.target.value)}
                  placeholder="مثلاً: 1405/09/15"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  dir="ltr"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-bold">علت یا توضیحات مرخصی (اختیاری)</span>
                <textarea
                  rows={2}
                  value={modalLeaveNote}
                  onChange={(e) => setModalLeaveNote(e.target.value)}
                  placeholder="مثلاً: مرخصی با هماهنگی سرپرست / اعزام به منزل"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </label>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLeaveTargetStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black cursor-pointer"
                >
                  ثبت وضعیت مرخصی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تایید بازنشانی گروهی به حالت پیش‌فرض (حاضر در سرا) */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  بازنشانی وضعیت ساکنین به «حاضر در سرا»؟
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  وضعیت تمام {activeScopeResidents.length.toLocaleString('fa-IR')} دانشجوی خوابگاهی این محدوده (کسانی که در حالت خروج، مرخصی یا غیبت بودند) به حالت پیش‌فرض «حاضر در سرا» بازمی‌گردد و در تاریخچه ثبت می‌شود.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleExecuteResetToDefault}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer"
              >
                تایید و بازنشانی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال چاپ دسته‌جمعی برگه بارکددار دانشجویان سرا (Code-128 + QR واقعی) */}
      {batchPrintOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #printable-batch-barcode-sheet, #printable-batch-barcode-sheet * {
                visibility: visible;
              }
              #printable-batch-barcode-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: #ffffff !important;
                color: #000000 !important;
                padding: 8mm !important;
              }
            }
          `}</style>
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 print:hidden">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  چاپ برگه کارت‌های بارکددار واقعی ساکنان ({batchPrintItems.length.toLocaleString('fa-IR')} نفر)
                </h3>
                <p className="text-[11px] text-slate-500">
                  شامل بارکد خطی Code-128 و کد QR یکتای هر دانشجو جهت استفاده با دستگاه بارکدخوان در نگهبانی سرا
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ برگه (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBatchPrintOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {batchPrintPreparing ? (
              <div className="p-10 text-center text-xs text-slate-500">
                در حال تولید بارکدهای واقعی دانشجویان...
              </div>
            ) : (
              <div
                id="printable-batch-barcode-sheet"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-slate-900"
              >
                {batchPrintItems.map((item) => (
                  <div
                    key={item.student.studentId}
                    className="bg-white rounded-xl border border-slate-300 p-2.5 space-y-1.5 break-inside-avoid"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-black text-xs text-slate-900 truncate">
                          {item.student.fullName}
                        </div>
                        <div className="text-[10px] text-slate-600 truncate">
                          {item.dormName} · اتاق {item.roomNumber} · {item.bedLabel}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500" dir="ltr">
                          {item.barcodeValue} | {item.student.nationalId}
                        </div>
                      </div>
                      {item.qrDataUrl && (
                        <img
                          src={item.qrDataUrl}
                          alt={item.barcodeValue}
                          className="w-12 h-12 border border-slate-200 rounded shrink-0"
                        />
                      )}
                    </div>
                    {item.barcodeSvgHtml && (
                      <div
                        className="bg-white pt-1 border-t border-slate-200"
                        dangerouslySetInnerHTML={{ __html: item.barcodeSvgHtml }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
