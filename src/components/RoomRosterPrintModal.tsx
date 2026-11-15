import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppSettings, Bed, Dormitory, Room, Student } from '../types';
import { toEnglishDigits } from '../utils/excelUtils';
import { isSafeMediaUrl } from '../utils/sanitizeHtml';
import {
  Building2,
  Check,
  CheckSquare,
  Crown,
  FileText,
  Filter,
  Printer,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Square,
  Users,
  X,
} from 'lucide-react';

export type RosterPaperSize = 'A4' | 'A5';

export interface RosterPrintableFields {
  photo: boolean;
  studentId: boolean;
  fullName: boolean;
  fieldOfStudy: boolean;
  entryTerm: boolean;
  bedLabel: boolean;
  fatherName: boolean;
  nationalId: boolean;
  mobile: boolean;
  emergencyPhone: boolean;
  cityProvince: boolean;
  signatureBox: boolean;
}

export const DEFAULT_ROSTER_FIELDS: RosterPrintableFields = {
  photo: true,
  studentId: true,
  fullName: true,
  fieldOfStudy: true,
  entryTerm: true,
  bedLabel: false,
  fatherName: false,
  nationalId: false,
  mobile: false,
  emergencyPhone: false,
  cityProvince: false,
  signatureBox: false,
};

const FIELD_OPTIONS: Array<{
  key: keyof RosterPrintableFields;
  label: string;
  isDefault?: boolean;
}> = [
  { key: 'photo', label: 'عکس دانشجو', isDefault: true },
  { key: 'fullName', label: 'نام و نام خانوادگی', isDefault: true },
  { key: 'studentId', label: 'کد دانشجویی', isDefault: true },
  { key: 'fieldOfStudy', label: 'رشته تحصیلی', isDefault: true },
  { key: 'entryTerm', label: 'سال / ترم ورودی', isDefault: true },
  { key: 'bedLabel', label: 'شماره / طبقه تخت' },
  { key: 'fatherName', label: 'نام پدر' },
  { key: 'nationalId', label: 'کد ملی' },
  { key: 'mobile', label: 'شماره همراه' },
  { key: 'emergencyPhone', label: 'شماره تماس اضطراری' },
  { key: 'cityProvince', label: 'استان و شهر' },
  { key: 'signatureBox', label: 'کادر امضاء / حضور' },
];

interface RoomRosterPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  settings?: AppSettings;
  initialDormId?: string;
  initialRoomIds?: string[];
  actorTitle?: string;
}

interface PreparedRoomData {
  room: Room;
  dorm?: Dormitory;
  vacantCount: number;
  representative: {
    student: Student;
    bed: Bed;
    isAutoDefault: boolean;
  } | null;
  orderedMembers: Array<{
    student: Student;
    bed: Bed;
    isRepresentative: boolean;
    isAutoDefaultRep: boolean;
  }>;
}

function escapeHtml(raw?: string | number | null): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const RoomRosterPrintModal: React.FC<RoomRosterPrintModalProps> = ({
  isOpen,
  onClose,
  dorms,
  rooms,
  beds,
  students,
  settings,
  initialDormId = 'all',
  initialRoomIds,
  actorTitle = 'مدیریت و سرپرستی امور سراها',
}) => {
  const [paperSize, setPaperSize] = useState<RosterPaperSize>('A4');
  const [fields, setFields] = useState<RosterPrintableFields>(DEFAULT_ROSTER_FIELDS);
  const [filterDormId, setFilterDormId] = useState<string>(initialDormId || 'all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [roomSearch, setRoomSearch] = useState('');
  const [onlyOccupiedRooms, setOnlyOccupiedRooms] = useState(true);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  const wasOpenRef = useRef(false);
  const lastInitKeyRef = useRef<string>('');

  // همگام‌سازی وضعیت اولیه فقط هنگام باز شدن مدال یا تغییر پارامترهای ورودی
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    const initKey = `${initialDormId || ''}|${(initialRoomIds || []).join(',')}`;
    if (wasOpenRef.current && lastInitKeyRef.current === initKey) {
      return;
    }
    wasOpenRef.current = true;
    lastInitKeyRef.current = initKey;

    setFilterDormId(initialDormId || 'all');
    setFilterFloor('all');
    setRoomSearch('');

    if (initialRoomIds && initialRoomIds.length > 0) {
      setSelectedRoomIds(initialRoomIds);
      setOnlyOccupiedRooms(false);
    } else {
      const targetDormIds =
        initialDormId && initialDormId !== 'all'
          ? [initialDormId]
          : dorms.map((d) => d.id);
      const occupiedRoomIds = rooms
        .filter((r) => targetDormIds.includes(r.dormId))
        .filter((r) => beds.some((b) => b.roomId === r.id && Boolean(b.studentId)))
        .map((r) => r.id);
      setSelectedRoomIds(occupiedRoomIds);
      setOnlyOccupiedRooms(true);
    }
  }, [isOpen, initialDormId, initialRoomIds, dorms, rooms, beds]);

  // آماده‌سازی اطلاعات همه اتاق‌ها با منطق نماینده در ردیف اول
  const preparedRoomsMap = useMemo(() => {
    const map = new Map<string, PreparedRoomData>();

    rooms.forEach((room) => {
      const dorm = dorms.find((d) => d.id === room.dormId);
      const roomBeds = beds.filter((b) => b.roomId === room.id);
      const occupied = roomBeds
        .map((bed) => ({
          bed,
          student: students.find((s) => s.studentId === bed.studentId),
        }))
        .filter((item): item is { bed: Bed; student: Student } => Boolean(item.student));

      const vacantCount = roomBeds.filter((b) => !b.studentId).length;

      const explicitRep = room.representativeStudentId
        ? occupied.find((item) => item.student.studentId === room.representativeStudentId)
        : undefined;
      const repItem = explicitRep || occupied[0] || null;
      const isAutoDefault = !explicitRep && occupied.length > 0;
      const repId = repItem?.student.studentId;

      // نماینده همیشه در بالای لیست قرار می‌گیرد
      const orderedMembers = [...occupied]
        .sort((a, b) => {
          if (a.student.studentId === repId) return -1;
          if (b.student.studentId === repId) return 1;
          return 0;
        })
        .map((item) => ({
          ...item,
          isRepresentative: item.student.studentId === repId,
          isAutoDefaultRep: item.student.studentId === repId && isAutoDefault,
        }));

      map.set(room.id, {
        room,
        dorm,
        vacantCount,
        representative: repItem
          ? {
              student: repItem.student,
              bed: repItem.bed,
              isAutoDefault,
            }
          : null,
        orderedMembers,
      });
    });

    return map;
  }, [rooms, dorms, beds, students]);

  const availableFloors = useMemo(() => {
    const set = new Set<number>();
    rooms
      .filter((r) => filterDormId === 'all' || r.dormId === filterDormId)
      .forEach((r) => set.add(r.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms, filterDormId]);

  const visibleSelectableRooms = useMemo(() => {
    const q = toEnglishDigits(roomSearch.trim().toLowerCase());
    return rooms
      .filter((r) => {
        if (filterDormId !== 'all' && r.dormId !== filterDormId) return false;
        if (filterFloor !== 'all' && String(r.floor) !== filterFloor) return false;
        const prep = preparedRoomsMap.get(r.id);
        if (onlyOccupiedRooms && (!prep || prep.orderedMembers.length === 0)) return false;
        if (q) {
          const roomNum = toEnglishDigits(r.roomNumber).toLowerCase();
          const dormName = (prep?.dorm?.name || '').toLowerCase();
          const memberHit = prep?.orderedMembers.some(
            (m) =>
              (m.student.fullName || '').toLowerCase().includes(q) ||
              toEnglishDigits(m.student.studentId || '').includes(q)
          );
          if (!roomNum.includes(q) && !dormName.includes(q) && !memberHit) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dA = dorms.find((d) => d.id === a.dormId)?.name || '';
        const dB = dorms.find((d) => d.id === b.dormId)?.name || '';
        const cmpDorm = dA.localeCompare(dB, 'fa');
        if (cmpDorm !== 0) return cmpDorm;
        return toEnglishDigits(a.roomNumber).localeCompare(toEnglishDigits(b.roomNumber), 'fa', {
          numeric: true,
        });
      });
  }, [rooms, dorms, preparedRoomsMap, filterDormId, filterFloor, onlyOccupiedRooms, roomSearch]);

  const selectedPreparedRooms = useMemo(() => {
    const idSet = new Set(selectedRoomIds);
    return rooms
      .filter((r) => idSet.has(r.id))
      .map((r) => preparedRoomsMap.get(r.id))
      .filter((p): p is PreparedRoomData => Boolean(p))
      .sort((a, b) => {
        const dA = a.dorm?.name || '';
        const dB = b.dorm?.name || '';
        const cmpDorm = dA.localeCompare(dB, 'fa');
        if (cmpDorm !== 0) return cmpDorm;
        return toEnglishDigits(a.room.roomNumber).localeCompare(
          toEnglishDigits(b.room.roomNumber),
          'fa',
          { numeric: true }
        );
      });
  }, [rooms, selectedRoomIds, preparedRoomsMap]);

  if (!isOpen) return null;

  const toggleField = (key: keyof RosterPrintableFields) => {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const selectAllVisibleRooms = () => {
    const visibleIds = visibleSelectableRooms.map((r) => r.id);
    setSelectedRoomIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const selectAllOccupiedInScope = () => {
    const ids = rooms
      .filter((r) => filterDormId === 'all' || r.dormId === filterDormId)
      .filter((r) => (preparedRoomsMap.get(r.id)?.orderedMembers.length || 0) > 0)
      .map((r) => r.id);
    setSelectedRoomIds(ids);
  };

  const clearSelectedRooms = () => {
    setSelectedRoomIds([]);
  };

  const handlePrint = () => {
    if (selectedPreparedRooms.length === 0) return;
    const iframe = printIframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    setIsPrinting(true);
    const todayFa = new Date().toLocaleDateString('fa-IR');
    const systemTitle = settings?.universityName
      ? `اداره امور سراهای دانشجویی • ${settings.universityName}`
      : 'سامانه جامع مدیریت سراهای دانشجویی دانشگاه فرهنگیان';
    const logoUrl = settings?.customLogoUrl || '';
    const isA5 = paperSize === 'A5';

    // استخراج لینک‌های فونت از صفحه اصلی برای چاپ دقیق با فونت فارسی
    const headLinks = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const sheetsHtml = selectedPreparedRooms
      .map((prep) => {
        const rep = prep.representative;
        const memberCount = prep.orderedMembers.length;
        const compactForMany = memberCount > 6;

        const cardsHtml =
          memberCount === 0
            ? `<div class="empty-room">این اتاق در حال حاضر بدون ساکن است.</div>`
            : prep.orderedMembers
                .map(({ student: st, bed, isRepresentative, isAutoDefaultRep }, index) => {
                  const initials = escapeHtml((st.fullName || 'د').trim().slice(0, 1));
                  const bgColor = escapeHtml(st.avatarColor || '#0d9488');
                  const photoBlock = fields.photo
                    ? st.photoUrl && isSafeMediaUrl(st.photoUrl)
                      ? `<div class="photo-wrap ${isRepresentative ? 'rep-photo' : ''}">
                           <img src="${escapeHtml(st.photoUrl)}" alt="${escapeHtml(st.fullName)}" />
                         </div>`
                      : `<div class="photo-wrap avatar-fallback ${isRepresentative ? 'rep-photo' : ''}" style="background:${bgColor}">
                           <span>${initials}</span>
                         </div>`
                    : '';

                  const infoLines: string[] = [];
                  if (fields.studentId) {
                    infoLines.push(
                      `<div class="info-row"><span class="lbl">کد دانشجویی:</span> <span class="val mono">${escapeHtml(st.studentId)}</span></div>`
                    );
                  }
                  if (fields.fieldOfStudy) {
                    infoLines.push(
                      `<div class="info-row"><span class="lbl">رشته:</span> <span class="val">${escapeHtml(st.fieldOfStudy || '-')}</span></div>`
                    );
                  }
                  if (fields.entryTerm) {
                    infoLines.push(
                      `<div class="info-row"><span class="lbl">ورودی:</span> <span class="val mono">${escapeHtml(st.entryTerm || '-')}</span></div>`
                    );
                  }
                  if (fields.bedLabel) {
                    infoLines.push(
                      `<div class="info-row"><span class="lbl">تخت:</span> <span class="val">${escapeHtml(bed.label)}</span></div>`
                    );
                  }
                  if (fields.fatherName) {
                    infoLines.push(
                      `<div class="info-row"><span class="lbl">نام پدر:</span> <span class="val">${escapeHtml(st.fatherName || '-')}</span></div>`
                    );
                  }
                  if (fields.nationalId) {
                    infoLines.push(
                      `<div class="info-row"><span class="lbl">کد ملی:</span> <span class="val mono">${escapeHtml(st.nationalId || '-')}</span></div>`
                    );
                  }
                  if (fields.mobile) {
                    infoLines.push(
                      `<div class="info-row"><span class="lbl">همراه:</span> <span class="val mono" dir="ltr">${escapeHtml(st.mobile || '-')}</span></div>`
                    );
                  }
                  if (fields.emergencyPhone) {
                    infoLines.push(
                      `<div class="info-row"><span class="lbl">اضطراری:</span> <span class="val mono" dir="ltr">${escapeHtml(st.emergencyPhone || '-')}</span></div>`
                    );
                  }
                  if (fields.cityProvince) {
                    const loc = [st.province, st.city].filter(Boolean).join(' - ') || '-';
                    infoLines.push(
                      `<div class="info-row"><span class="lbl">محل سکونت:</span> <span class="val">${escapeHtml(loc)}</span></div>`
                    );
                  }

                  const repBadge = isRepresentative
                    ? `<span class="rep-badge">★ ${
                        isAutoDefaultRep ? 'نماینده اتاق (پیش‌فرض)' : 'نماینده رسمی اتاق'
                      }</span>`
                    : `<span class="index-badge">${(index + 1).toLocaleString('fa-IR')}</span>`;

                  const sigBox = fields.signatureBox
                    ? `<div class="sig-box">امضاء / حضور</div>`
                    : '';

                  return `
                    <div class="student-card ${isRepresentative ? 'is-rep' : ''}">
                      <div class="card-top">
                        ${photoBlock}
                        <div class="card-body">
                          <div class="name-line">
                            ${
                              fields.fullName
                                ? `<div class="st-name">${escapeHtml(st.fullName)}</div>`
                                : `<div class="st-name">دانشجو #${(index + 1).toLocaleString('fa-IR')}</div>`
                            }
                            ${repBadge}
                          </div>
                          <div class="info-list">
                            ${infoLines.join('')}
                          </div>
                          ${sigBox}
                        </div>
                      </div>
                    </div>
                  `;
                })
                .join('');

        return `
          <section class="room-sheet ${isA5 ? 'size-a5' : 'size-a4'} ${compactForMany ? 'dense' : ''}">
            <header class="sheet-header">
              <div class="header-right">
                ${
                  logoUrl && isSafeMediaUrl(logoUrl)
                    ? `<img src="${escapeHtml(logoUrl)}" alt="نشان" class="uni-logo" />`
                    : `<div class="uni-badge">سرا</div>`
                }
                <div>
                  <div class="sys-title">${escapeHtml(systemTitle)}</div>
                  <div class="dorm-title">${escapeHtml(prep.dorm?.name || 'سرای دانشجویی')}</div>
                </div>
              </div>
              <div class="room-pill">
                <div class="room-num">اتاق ${escapeHtml(prep.room.roomNumber)}</div>
                <div class="room-meta">
                  طبقه ${Number(prep.room.floor || 0).toLocaleString('fa-IR')} • ظرفیت ${Number(prep.room.capacity || 0).toLocaleString('fa-IR')} نفر • ساکن: ${memberCount.toLocaleString('fa-IR')}
                </div>
              </div>
            </header>

            <div class="rep-banner ${rep ? 'has-rep' : 'no-rep'}">
              ${
                rep
                  ? `<div class="rep-banner-main">
                       <span class="rep-star">👑</span>
                       <span class="rep-title">نماینده اتاق:</span>
                       <strong class="rep-name">${escapeHtml(rep.student.fullName)}</strong>
                       ${
                         fields.studentId
                           ? `<span class="rep-code">(کد دانشجویی: <span class="mono">${escapeHtml(rep.student.studentId)}</span>)</span>`
                           : ''
                       }
                       <span class="rep-tag">${rep.isAutoDefault ? 'نماینده پیش‌فرض (نفر اول)' : 'نماینده رسمی منتخب'}</span>
                     </div>`
                  : `<div class="rep-banner-main">نماینده اتاق: فاقد ساکن</div>`
              }
              <div class="print-date">تاریخ چاپ: ${escapeHtml(todayFa)}</div>
            </div>

            <div class="students-grid">
              ${cardsHtml}
            </div>

            <footer class="sheet-footer">
              <span>تنظیم‌کننده: ${escapeHtml(actorTitle)}</span>
              <span>مهر و امضاء سرپرستی سرا: .........................</span>
            </footer>
          </section>
        `;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <base href="${window.location.origin}/" />
  <title>چاپ لیست ساکنین اتاق‌ها (${paperSize})</title>
  ${headLinks}
  <style>
    @page {
      size: ${paperSize} portrait;
      margin: ${isA5 ? '6mm' : '8mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-variant-numeric: tabular-nums;
    }
    .room-sheet {
      width: 100%;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      padding: ${isA5 ? '8px 10px' : '12px 14px'};
      background: #ffffff;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .room-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: ${isA5 ? '7px 10px' : '10px 14px'};
      border-radius: 10px;
      background: linear-gradient(135deg, #0f172a 0%, #115e59 100%);
      color: #ffffff;
      margin-bottom: ${isA5 ? '6px' : '9px'};
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .uni-logo {
      width: ${isA5 ? '30px' : '38px'};
      height: ${isA5 ? '30px' : '38px'};
      object-fit: contain;
      background: #ffffff;
      border-radius: 8px;
      padding: 2px;
      flex-shrink: 0;
    }
    .uni-badge {
      width: ${isA5 ? '30px' : '38px'};
      height: ${isA5 ? '30px' : '38px'};
      border-radius: 8px;
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: ${isA5 ? '11px' : '13px'};
      flex-shrink: 0;
    }
    .sys-title {
      font-size: ${isA5 ? '8.5px' : '10.5px'};
      color: #99f6e4;
      font-weight: 700;
    }
    .dorm-title {
      font-size: ${isA5 ? '11.5px' : '14px'};
      font-weight: 900;
      color: #ffffff;
    }
    .room-pill {
      text-align: left;
      background: rgba(255,255,255,0.14);
      border: 1px solid rgba(255,255,255,0.28);
      border-radius: 9px;
      padding: ${isA5 ? '4px 8px' : '6px 12px'};
      flex-shrink: 0;
    }
    .room-num {
      font-size: ${isA5 ? '13px' : '16px'};
      font-weight: 900;
      color: #fef08a;
      line-height: 1.2;
    }
    .room-meta {
      font-size: ${isA5 ? '8px' : '9.5px'};
      color: #e2e8f0;
      margin-top: 2px;
    }
    .rep-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: ${isA5 ? '5px 8px' : '7px 11px'};
      border-radius: 9px;
      background: linear-gradient(90deg, #faf5ff 0%, #fffbeb 100%);
      border: 1.5px solid #a855f7;
      margin-bottom: ${isA5 ? '7px' : '10px'};
      font-size: ${isA5 ? '9.5px' : '11px'};
    }
    .rep-banner-main {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 5px;
    }
    .rep-title {
      font-weight: 800;
      color: #6b21a8;
    }
    .rep-name {
      font-weight: 900;
      color: #3b0764;
      font-size: ${isA5 ? '10.5px' : '12px'};
    }
    .rep-code {
      color: #581c87;
      font-size: ${isA5 ? '8.5px' : '10px'};
    }
    .rep-tag {
      background: #7e22ce;
      color: #ffffff;
      border-radius: 999px;
      padding: 1px 7px;
      font-size: ${isA5 ? '8px' : '9px'};
      font-weight: 800;
    }
    .print-date {
      font-size: ${isA5 ? '8px' : '9.5px'};
      color: #475569;
      font-weight: 700;
      flex-shrink: 0;
    }
    .students-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: ${isA5 ? '6px' : '9px'};
    }
    .room-sheet.dense .students-grid {
      gap: ${isA5 ? '4px' : '7px'};
    }
    .student-card {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: ${isA5 ? '5px 6px' : '8px 10px'};
      background: #f8fafc;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .student-card.is-rep {
      background: linear-gradient(135deg, #faf5ff 0%, #fefce8 100%);
      border: 1.8px solid #9333ea;
      box-shadow: 0 1px 4px rgba(147, 51, 234, 0.14);
    }
    .card-top {
      display: flex;
      align-items: flex-start;
      gap: ${isA5 ? '6px' : '9px'};
    }
    .photo-wrap {
      width: ${isA5 ? '44px' : '58px'};
      height: ${isA5 ? '54px' : '70px'};
      border-radius: 8px;
      overflow: hidden;
      border: 1.5px solid #94a3b8;
      background: #ffffff;
      flex-shrink: 0;
    }
    .room-sheet.dense .photo-wrap {
      width: ${isA5 ? '38px' : '50px'};
      height: ${isA5 ? '46px' : '60px'};
    }
    .photo-wrap.rep-photo {
      border: 2px solid #9333ea;
    }
    .photo-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .avatar-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 900;
      font-size: ${isA5 ? '16px' : '22px'};
    }
    .card-body {
      flex: 1;
      min-width: 0;
    }
    .name-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      padding-bottom: 3px;
      margin-bottom: 3px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .st-name {
      font-weight: 900;
      font-size: ${isA5 ? '9.5px' : '11.5px'};
      color: #0f172a;
      line-height: 1.3;
    }
    .rep-badge {
      background: #7e22ce;
      color: #ffffff;
      font-size: ${isA5 ? '7px' : '8.5px'};
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 999px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .index-badge {
      background: #e2e8f0;
      color: #334155;
      font-size: ${isA5 ? '7.5px' : '9px'};
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 999px;
      flex-shrink: 0;
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: ${isA5 ? '1.5px' : '2.5px'};
    }
    .info-row {
      font-size: ${isA5 ? '8px' : '9.5px'};
      line-height: 1.35;
      color: #334155;
    }
    .info-row .lbl {
      color: #64748b;
      font-weight: 700;
    }
    .info-row .val {
      color: #0f172a;
      font-weight: 800;
    }
    .sig-box {
      margin-top: 4px;
      border: 1px dashed #94a3b8;
      border-radius: 5px;
      padding: 2px 5px;
      font-size: ${isA5 ? '7.5px' : '8.5px'};
      color: #64748b;
      text-align: center;
      background: #ffffff;
    }
    .empty-room {
      grid-column: 1 / -1;
      padding: 24px;
      text-align: center;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      color: #64748b;
      font-size: 11px;
    }
    .sheet-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: ${isA5 ? '7px' : '11px'};
      padding-top: ${isA5 ? '5px' : '7px'};
      border-top: 1px solid #cbd5e1;
      font-size: ${isA5 ? '8px' : '9.5px'};
      color: #475569;
      font-weight: 700;
    }
  </style>
</head>
<body>
  ${sheetsHtml}
</body>
</html>`;

    const doc = iframe.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();

    // صبر کوتاه برای بارگذاری فونت و تصاویر درون فریم پیش از باز کردن پنجره چاپ
    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setIsPrinting(false);
      }
    };

    const imgs = Array.from(doc.images || []);
    const pendingImgs = imgs.filter((img) => !img.complete);
    if (pendingImgs.length === 0) {
      setTimeout(triggerPrint, 250);
    } else {
      let resolved = 0;
      let printed = false;
      const done = () => {
        if (printed) return;
        printed = true;
        setTimeout(triggerPrint, 180);
      };
      const timer = setTimeout(done, 1500);
      pendingImgs.forEach((img) => {
        const onEnd = () => {
          resolved++;
          if (resolved >= pendingImgs.length) {
            clearTimeout(timer);
            done();
          }
        };
        img.addEventListener('load', onEnd, { once: true });
        img.addEventListener('error', onEnd, { once: true });
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in">
      {/* فریم مخفی و ایزوله برای چاپ چندصفحه‌ای دقیق در سایز A4 و A5 */}
      <iframe
        ref={printIframeRef}
        title="print-room-rosters-frame"
        className="w-0 h-0 border-0 fixed -left-[9999px] -top-[9999px]"
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* سربرگ مدال */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-l from-slate-900 via-teal-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                چاپ لیست تصویری ساکنین اتاق‌ها (A4 / A5)
              </h3>
              <p className="text-[11px] text-teal-200/85 mt-0.5">
                نمایش نماینده در ردیف اول با مشخصات برجسته • انتخاب یک اتاق، چند اتاق یا همه اتاق‌ها در صفحات مجزا
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedPreparedRooms.length === 0 || isPrinting}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isPrinting
                  ? 'در حال آماده‌سازی چاپ...'
                  : `چاپ ${selectedPreparedRooms.length.toLocaleString('fa-IR')} اتاق (${paperSize})`}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* بدنه دوسطونی: پنل تنظیمات و فیلترها + پیش‌نمایش زنده برگه چاپ */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* ستون سمت راست: تنظیمات صفحه، فیلدهای قابل چاپ و انتخاب اتاق‌ها */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-y-auto p-4 space-y-5 text-xs max-h-[38vh] lg:max-h-none">
            {/* ۱. انتخاب اندازه کاغذ A4 یا A5 */}
            <div className="space-y-2">
              <div className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>ابعاد برگه چاپ:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperSize('A4')}
                  className={`p-2.5 rounded-xl border font-bold transition cursor-pointer text-center ${
                    paperSize === 'A4'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>برگه A4</div>
                  <div className={`text-[10px] mt-0.5 ${paperSize === 'A4' ? 'text-teal-100' : 'text-slate-400'}`}>
                    ۲۱۰ × ۲۹۷ میلی‌متر (بزرگ و خوانا)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperSize('A5')}
                  className={`p-2.5 rounded-xl border font-bold transition cursor-pointer text-center ${
                    paperSize === 'A5'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>برگه A5</div>
                  <div className={`text-[10px] mt-0.5 ${paperSize === 'A5' ? 'text-teal-100' : 'text-slate-400'}`}>
                    ۱۴۸ × ۲۱۰ میلی‌متر (نصف A4 / نصب در اتاق)
                  </div>
                </button>
              </div>
            </div>

            {/* ۲. فیلتر اطلاعات قابل چاپ هر دانشجو */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span>فیلتر اطلاعات قابل چاپ دانشجو:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFields(DEFAULT_ROSTER_FIELDS)}
                  className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>حالت پیش‌فرض</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {FIELD_OPTIONS.map((opt) => {
                  const checked = fields[opt.key];
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleField(opt.key)}
                      className={`px-2.5 py-2 rounded-xl border text-right text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        checked
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-400 dark:border-teal-700 text-teal-900 dark:text-teal-200'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ۳. انتخاب اتاق‌ها (تکی، چندتایی یا همه یکجا) */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>انتخاب اتاق‌ها ({selectedRoomIds.length} انتخاب شده):</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterDormId}
                  onChange={(e) => {
                    setFilterDormId(e.target.value);
                    setFilterFloor('all');
                  }}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="all">همه سراها</option>
                  {dorms.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterFloor}
                  onChange={(e) => setFilterFloor(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="all">همه طبقات</option>
                  {availableFloors.map((fl) => (
                    <option key={fl} value={String(fl)}>
                      طبقه {fl.toLocaleString('fa-IR')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  placeholder="جستجوی شماره اتاق، سرا یا نام دانشجو..."
                  className="w-full pr-8 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyOccupiedRooms}
                    onChange={(e) => setOnlyOccupiedRooms(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>فقط اتاق‌های دارای دانشجو</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={selectAllVisibleRooms}
                    className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold cursor-pointer"
                  >
                    انتخاب نمایش‌داده‌شده‌ها
                  </button>
                  <button
                    type="button"
                    onClick={selectAllOccupiedInScope}
                    className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold cursor-pointer"
                  >
                    همه اتاق‌های فعال
                  </button>
                  {selectedRoomIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSelectedRooms}
                      className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold cursor-pointer"
                    >
                      لغو همه
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                {visibleSelectableRooms.length === 0 ? (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-[11px] text-slate-400">
                    اتاقی با فیلترهای فعلی یافت نشد.
                  </div>
                ) : (
                  visibleSelectableRooms.map((r) => {
                    const prep = preparedRoomsMap.get(r.id);
                    const count = prep?.orderedMembers.length || 0;
                    const isSelected = selectedRoomIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRoomSelection(r.id)}
                        className={`w-full p-2 rounded-xl border text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-teal-600 text-white'
                                : 'border border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div className="truncate">
                            <span className="font-extrabold">اتاق {r.roomNumber}</span>
                            <span className="text-[10px] text-slate-400 mr-1.5">
                              ({prep?.dorm?.name || 'سرا'} • طبقه {r.floor})
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0 tabular-nums">
                          {count.toLocaleString('fa-IR')} نفر
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ستون سمت چپ: پیش‌نمایش زنده برگه‌های چاپ (سطح کاغذ سفید واقعی) */}
          <div className="lg:col-span-8 bg-slate-200/80 dark:bg-slate-950 overflow-y-auto p-4 sm:p-6 space-y-6">
            {selectedPreparedRooms.length === 0 ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 space-y-2">
                <Filter className="w-10 h-10 opacity-40" />
                <p className="text-sm font-bold">هیچ اتاقی برای چاپ انتخاب نشده است</p>
                <p className="text-xs">
                  از ستون سمت راست یک، چند یا همه اتاق‌ها را انتخاب کنید تا پیش‌نمایش چاپ نمایش داده شود.
                </p>
              </div>
            ) : (
              selectedPreparedRooms.map((prep, sheetIdx) => {
                const rep = prep.representative;
                const isA5 = paperSize === 'A5';

                return (
                  <div key={prep.room.id} className="flex flex-col items-center">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                      <span>
                        برگه {(sheetIdx + 1).toLocaleString('fa-IR')} از{' '}
                        {selectedPreparedRooms.length.toLocaleString('fa-IR')} • ابعاد {paperSize}
                      </span>
                    </div>

                    {/* شبیه‌سازی دقیق برگه کاغذ سفید A4 / A5 */}
                    <div
                      className={`w-full bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-300 ${
                        isA5 ? 'max-w-[540px] p-3.5' : 'max-w-[780px] p-5'
                      }`}
                    >
                      {/* سربرگ برگه اتاق */}
                      <div
                        className={`rounded-xl bg-gradient-to-l from-slate-900 via-teal-900 to-teal-950 text-white flex items-center justify-between gap-3 ${
                          isA5 ? 'p-2.5 mb-2' : 'p-3.5 mb-3'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {settings?.customLogoUrl ? (
                            <img
                              src={settings.customLogoUrl}
                              alt="نشان دانشگاه"
                              className={`${
                                isA5 ? 'w-8 h-8' : 'w-10 h-10'
                              } rounded-lg object-contain bg-white p-0.5 shrink-0`}
                            />
                          ) : (
                            <div
                              className={`${
                                isA5 ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs'
                              } rounded-lg bg-white/15 border border-white/25 flex items-center justify-center font-black shrink-0`}
                            >
                              سرا
                            </div>
                          )}
                          <div className="min-w-0">
                            <div
                              className={`${
                                isA5 ? 'text-[9px]' : 'text-[11px]'
                              } text-teal-200 font-bold truncate`}
                            >
                              {settings?.universityName
                                ? `امور سراهای دانشجویی • ${settings.universityName}`
                                : 'سامانه جامع مدیریت سراهای دانشجویی'}
                            </div>
                            <div
                              className={`${
                                isA5 ? 'text-xs' : 'text-sm'
                              } font-black text-white truncate`}
                            >
                              {prep.dorm?.name || 'سرای دانشجویی'}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`rounded-xl bg-white/15 border border-white/25 text-left shrink-0 ${
                            isA5 ? 'px-2.5 py-1' : 'px-3.5 py-1.5'
                          }`}
                        >
                          <div
                            className={`${
                              isA5 ? 'text-xs' : 'text-base'
                            } font-black text-amber-200`}
                          >
                            اتاق {prep.room.roomNumber}
                          </div>
                          <div className={`${isA5 ? 'text-[8.5px]' : 'text-[10px]'} text-slate-200`}>
                            طبقه {prep.room.floor.toLocaleString('fa-IR')} • ساکن:{' '}
                            {prep.orderedMembers.length.toLocaleString('fa-IR')} از{' '}
                            {prep.room.capacity.toLocaleString('fa-IR')}
                          </div>
                        </div>
                      </div>

                      {/* نوار نماینده اتاق در بالای لیست */}
                      <div
                        className={`rounded-xl border border-purple-400 bg-gradient-to-l from-purple-50 via-fuchsia-50/70 to-amber-50 flex flex-wrap items-center justify-between gap-2 ${
                          isA5 ? 'px-2.5 py-1.5 mb-2 text-[10px]' : 'px-3.5 py-2 mb-3 text-xs'
                        }`}
                      >
                        {rep ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="font-extrabold text-purple-800">نماینده اتاق:</span>
                            <span className="font-black text-purple-950">{rep.student.fullName}</span>
                            {fields.studentId && (
                              <span className="text-purple-700 font-mono text-[10px]">
                                ({rep.student.studentId})
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-purple-700 text-white text-[9px] font-extrabold">
                              {rep.isAutoDefault ? 'نماینده پیش‌فرض (نفر اول)' : 'نماینده رسمی'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-bold">اتاق خالی (بدون نماینده)</span>
                        )}
                        <span className="text-[10px] text-slate-500 font-bold">
                          تاریخ: {new Date().toLocaleDateString('fa-IR')}
                        </span>
                      </div>

                      {/* گرید کارت‌های دانشجویان (نماینده در اولین خانه بالای لیست) */}
                      {prep.orderedMembers.length === 0 ? (
                        <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                          این اتاق در حال حاضر فاقد دانشجوی ساکن است.
                        </div>
                      ) : (
                        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isA5 ? 'gap-2' : 'gap-3'}`}>
                          {prep.orderedMembers.map(
                            ({ student: st, bed, isRepresentative, isAutoDefaultRep }, idx) => (
                              <div
                                key={st.studentId}
                                className={`rounded-xl flex items-start gap-2.5 ${
                                  isA5 ? 'p-2 text-[10px]' : 'p-2.5 text-xs'
                                } ${
                                  isRepresentative
                                    ? 'bg-gradient-to-bl from-purple-50 via-white to-amber-50 border-2 border-purple-500 shadow-xs'
                                    : 'bg-slate-50 border border-slate-200'
                                }`}
                              >
                                {fields.photo &&
                                  (st.photoUrl ? (
                                    <img
                                      src={st.photoUrl}
                                      alt={st.fullName}
                                      className={`${
                                        isA5 ? 'w-11 h-14' : 'w-14 h-[70px]'
                                      } rounded-lg object-cover shrink-0 border ${
                                        isRepresentative ? 'border-purple-500 border-2' : 'border-slate-300'
                                      }`}
                                    />
                                  ) : (
                                    <div
                                      className={`${
                                        isA5 ? 'w-11 h-14 text-sm' : 'w-14 h-[70px] text-lg'
                                      } rounded-lg text-white font-black flex items-center justify-center shrink-0 border ${
                                        isRepresentative ? 'border-purple-500 border-2' : 'border-slate-300'
                                      }`}
                                      style={{ backgroundColor: st.avatarColor || '#0d9488' }}
                                    >
                                      {(st.fullName || 'د').slice(0, 1)}
                                    </div>
                                  ))}

                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-1 pb-1 border-b border-dashed border-slate-300">
                                    <span className="font-black text-slate-900 truncate">
                                      {fields.fullName
                                        ? st.fullName
                                        : `دانشجو ${(idx + 1).toLocaleString('fa-IR')}`}
                                    </span>
                                    {isRepresentative ? (
                                      <span className="px-1.5 py-0.5 rounded-full bg-purple-700 text-white text-[9px] font-extrabold shrink-0">
                                        {isAutoDefaultRep ? '★ نماینده (پیش‌فرض)' : '★ نماینده'}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold shrink-0">
                                        {(idx + 1).toLocaleString('fa-IR')}
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-0.5 text-[10px] text-slate-700">
                                    {fields.studentId && (
                                      <div>
                                        <span className="text-slate-500">کد دانشجویی: </span>
                                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                                          {st.studentId}
                                        </span>
                                      </div>
                                    )}
                                    {fields.fieldOfStudy && (
                                      <div className="truncate">
                                        <span className="text-slate-500">رشته: </span>
                                        <span className="font-bold text-slate-900">
                                          {st.fieldOfStudy || '-'}
                                        </span>
                                      </div>
                                    )}
                                    {fields.entryTerm && (
                                      <div>
                                        <span className="text-slate-500">ورودی: </span>
                                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                                          {st.entryTerm || '-'}
                                        </span>
                                      </div>
                                    )}
                                    {fields.bedLabel && (
                                      <div>
                                        <span className="text-slate-500">تخت: </span>
                                        <span className="font-bold text-slate-900">{bed.label}</span>
                                      </div>
                                    )}
                                    {fields.fatherName && (
                                      <div>
                                        <span className="text-slate-500">نام پدر: </span>
                                        <span className="font-bold text-slate-900">{st.fatherName || '-'}</span>
                                      </div>
                                    )}
                                    {fields.nationalId && (
                                      <div>
                                        <span className="text-slate-500">کد ملی: </span>
                                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                                          {st.nationalId || '-'}
                                        </span>
                                      </div>
                                    )}
                                    {fields.mobile && (
                                      <div>
                                        <span className="text-slate-500">همراه: </span>
                                        <span className="font-mono font-bold text-slate-900 tabular-nums" dir="ltr">
                                          {st.mobile || '-'}
                                        </span>
                                      </div>
                                    )}
                                    {fields.emergencyPhone && (
                                      <div>
                                        <span className="text-slate-500">اضطراری: </span>
                                        <span className="font-mono font-bold text-slate-900 tabular-nums" dir="ltr">
                                          {st.emergencyPhone || '-'}
                                        </span>
                                      </div>
                                    )}
                                    {fields.cityProvince && (
                                      <div className="truncate">
                                        <span className="text-slate-500">سکونت: </span>
                                        <span className="font-bold text-slate-900">
                                          {[st.province, st.city].filter(Boolean).join(' - ') || '-'}
                                        </span>
                                      </div>
                                    )}
                                    {fields.signatureBox && (
                                      <div className="mt-1 py-0.5 px-2 rounded border border-dashed border-slate-300 bg-white text-center text-[9px] text-slate-400">
                                        امضاء / حضور
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* پاورقی برگه */}
                      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-teal-600" />
                          <span>{actorTitle}</span>
                        </span>
                        <span>مهر و امضاء سرپرستی سرا: .........................</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
