import { Dormitory, Room, Student } from '../types';
import { toEnglishDigits } from './excelUtils';
import { normalizePersianText } from './financeUtils';

export type StudentSortKey =
  | 'default'
  | 'lastName'
  | 'fullName'
  | 'studentId'
  | 'nationalId'
  | 'fieldOfStudy'
  | 'entryTerm'
  | 'roomName'
  | 'cityProvince'
  | 'debtAmount';

export function normSearchText(val?: string | number | null): string {
  return normalizePersianText(val == null ? '' : String(val));
}

export function extractStudentLastName(fullName?: string): string {
  const clean = (fullName || '').trim();
  if (!clean) return '';
  if (clean.includes('،') || clean.includes(',')) {
    return clean.split(/[،,]/)[0].trim();
  }
  const tokens = clean.split(/\s+/).filter(Boolean);
  return tokens.length > 1 ? tokens[tokens.length - 1] : clean;
}

export function compareStudents(
  a: Student,
  b: Student,
  sortBy: StudentSortKey,
  sortDir: 'asc' | 'desc',
  rooms: Room[],
  dorms: Dormitory[],
  getDebtAmount?: (studentId: string) => number
): number {
  if (sortBy === 'default') return 0;

  const dirFactor = sortDir === 'asc' ? 1 : -1;

  if (sortBy === 'lastName') {
    const lastA = extractStudentLastName(a.fullName);
    const lastB = extractStudentLastName(b.fullName);
    const cmpLast = lastA.localeCompare(lastB, 'fa', { numeric: true });
    if (cmpLast !== 0) return cmpLast * dirFactor;
    return (a.fullName || '').localeCompare(b.fullName || '', 'fa', { numeric: true }) * dirFactor;
  }

  if (sortBy === 'fullName') {
    return (
      (a.fullName || '').trim().localeCompare((b.fullName || '').trim(), 'fa', { numeric: true }) *
      dirFactor
    );
  }

  if (sortBy === 'studentId') {
    const idA = toEnglishDigits(a.studentId || '').trim();
    const idB = toEnglishDigits(b.studentId || '').trim();
    return idA.localeCompare(idB, 'en', { numeric: true }) * dirFactor;
  }

  if (sortBy === 'nationalId') {
    const nA = toEnglishDigits(a.nationalId || '').trim();
    const nB = toEnglishDigits(b.nationalId || '').trim();
    const cmp = nA.localeCompare(nB, 'en', { numeric: true });
    if (cmp !== 0) return cmp * dirFactor;
    return extractStudentLastName(a.fullName).localeCompare(extractStudentLastName(b.fullName), 'fa') * dirFactor;
  }

  if (sortBy === 'fieldOfStudy') {
    const fA = (a.fieldOfStudy || '').trim();
    const fB = (b.fieldOfStudy || '').trim();
    const cmp = fA.localeCompare(fB, 'fa', { numeric: true });
    if (cmp !== 0) return cmp * dirFactor;
    return extractStudentLastName(a.fullName).localeCompare(extractStudentLastName(b.fullName), 'fa') * dirFactor;
  }

  if (sortBy === 'entryTerm') {
    const eA = toEnglishDigits(a.entryTerm || '').trim();
    const eB = toEnglishDigits(b.entryTerm || '').trim();
    const cmp = eA.localeCompare(eB, 'en', { numeric: true });
    if (cmp !== 0) return cmp * dirFactor;
    return (
      toEnglishDigits(a.studentId || '').localeCompare(toEnglishDigits(b.studentId || ''), 'en', {
        numeric: true,
      }) * dirFactor
    );
  }

  if (sortBy === 'cityProvince') {
    const pA = `${(a.province || '').trim()} ${(a.city || '').trim()}`.trim();
    const pB = `${(b.province || '').trim()} ${(b.city || '').trim()}`.trim();
    const cmp = pA.localeCompare(pB, 'fa', { numeric: true });
    if (cmp !== 0) return cmp * dirFactor;
    return extractStudentLastName(a.fullName).localeCompare(extractStudentLastName(b.fullName), 'fa') * dirFactor;
  }

  if (sortBy === 'debtAmount' && getDebtAmount) {
    const dA = getDebtAmount(a.studentId);
    const dB = getDebtAmount(b.studentId);
    if (dA !== dB) return (dA - dB) * dirFactor;
    return extractStudentLastName(a.fullName).localeCompare(extractStudentLastName(b.fullName), 'fa');
  }

  if (sortBy === 'roomName') {
    const rA = rooms.find((rm) => rm.id === a.assignedRoomId);
    const rB = rooms.find((rm) => rm.id === b.assignedRoomId);
    const roomA = toEnglishDigits(rA?.roomNumber || a.assignedRoomNumber || '').trim();
    const roomB = toEnglishDigits(rB?.roomNumber || b.assignedRoomNumber || '').trim();

    const hasRoomA = Boolean(roomA && a.assignmentStatus !== 'none');
    const hasRoomB = Boolean(roomB && b.assignmentStatus !== 'none');

    if (!hasRoomA && !hasRoomB) {
      return extractStudentLastName(a.fullName).localeCompare(extractStudentLastName(b.fullName), 'fa');
    }
    if (!hasRoomA) return 1;
    if (!hasRoomB) return -1;

    const dA = dorms.find((dm) => dm.id === a.assignedDormId)?.name || a.assignedDormName || '';
    const dB = dorms.find((dm) => dm.id === b.assignedDormId)?.name || b.assignedDormName || '';
    const cmpRoom = roomA.localeCompare(roomB, 'fa', { numeric: true });
    if (cmpRoom !== 0) return cmpRoom * dirFactor;
    const cmpDorm = dA.localeCompare(dB, 'fa', { numeric: true });
    if (cmpDorm !== 0) return cmpDorm * dirFactor;
    return extractStudentLastName(a.fullName).localeCompare(extractStudentLastName(b.fullName), 'fa');
  }

  return 0;
}
