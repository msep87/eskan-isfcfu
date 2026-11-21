import {
  Student,
  StudentAdmissionStatus,
  StudentFinancialRecord,
  StudentFinancialStatus,
  StudentResidenceType,
} from '../types';
import { toEnglishDigits } from './excelUtils';

export type ProvinceOrigin = 'in_province' | 'out_of_province' | 'unknown';
export type PaymentMethod = 'auto_payroll' | 'in_person_accounting';

export interface ComputedStudentFinancialInfo {
  isDormResident: boolean;
  deductionRate: 45 | 25;
  provinceOrigin: ProvinceOrigin;
  paymentMethod: PaymentMethod;
  debtAmount: number;
  paidAmount: number;
  financialStatus: StudentFinancialStatus;
  fiscalNote: string;
  documentNumber: string;
  updatedAt?: string;
  updatedBy?: string;
}

export function normalizePersianText(val?: string | null): string {
  return toEnglishDigits(String(val ?? ''))
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/\u200c/g, ' ')
    .trim()
    .toLowerCase();
}

export function detectProvinceOrigin(province?: string | null): ProvinceOrigin {
  const norm = normalizePersianText(province);
  if (!norm || norm === '-' || norm === 'نامشخص') return 'unknown';
  if (norm.includes('اصفهان')) return 'in_province';
  return 'out_of_province';
}

export function parseResidenceTypeValue(
  raw?: string | number | boolean | null
): StudentResidenceType | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'boolean') return raw ? 'dormitory' : 'commuter';
  const norm = normalizePersianText(String(raw));
  if (!norm || norm === '-' || norm === 'نامشخص') return undefined;

  if (
    norm.includes('تردد') ||
    norm.includes('غیرخوابگاه') ||
    norm.includes('غیر خوابگاه') ||
    norm.includes('روزانه') ||
    norm.includes('commut') ||
    norm === 'day' ||
    norm === 'false' ||
    norm === '0' ||
    norm === 'خیر' ||
    norm === 'نه'
  ) {
    return 'commuter';
  }

  if (
    norm.includes('خوابگاه') ||
    norm.includes('سرا') ||
    norm.includes('ساکن') ||
    norm.includes('اسکان') ||
    norm.includes('شبان') ||
    norm.includes('dorm') ||
    norm.includes('resident') ||
    norm === 'true' ||
    norm === '1' ||
    norm === 'بله' ||
    norm === 'آری'
  ) {
    return 'dormitory';
  }

  return undefined;
}

export function getStudentResidenceType(
  student: Pick<Student, 'residenceType' | 'assignedBedId' | 'assignmentStatus'>
): StudentResidenceType {
  if (student.residenceType === 'dormitory' || student.residenceType === 'commuter') {
    return student.residenceType;
  }
  return student.assignedBedId && student.assignmentStatus !== 'none'
    ? 'dormitory'
    : 'commuter';
}

export function getStudentResidenceLabel(
  student: Pick<Student, 'residenceType' | 'assignedBedId' | 'assignmentStatus'>
): string {
  return getStudentResidenceType(student) === 'dormitory' ? 'خوابگاهی' : 'ترددی';
}

export function isStudentDormResident(student: Student): boolean {
  return getStudentResidenceType(student) === 'dormitory';
}

export function parseAdmissionStatusValue(
  raw?: string | number | boolean | null
): StudentAdmissionStatus | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'boolean') return raw ? 'admitted' : 'not_admitted';
  const norm = normalizePersianText(String(raw));
  if (!norm || norm === '-' || norm === 'نامشخص') return undefined;

  if (
    norm.includes('نشده') ||
    norm.includes('عدم پذیرش') ||
    norm.includes('عدمپذیرش') ||
    norm.includes('جدیدالورود') ||
    norm.includes('تکمیل نشده') ||
    norm.includes('not_admitted') ||
    norm.includes('not admitted') ||
    norm.includes('unadmitted') ||
    norm === 'pending' ||
    norm === 'no' ||
    norm === 'false' ||
    norm === '0' ||
    norm === 'خیر' ||
    norm === 'نه'
  ) {
    return 'not_admitted';
  }

  if (
    norm.includes('پذیرش') ||
    norm.includes('پذیرفته') ||
    norm.includes('تایید شده') ||
    norm.includes('تأیید شده') ||
    norm.includes('admitted') ||
    norm.includes('accepted') ||
    norm === 'yes' ||
    norm === 'true' ||
    norm === '1' ||
    norm === 'بله' ||
    norm === 'آری'
  ) {
    return 'admitted';
  }

  return undefined;
}

export function hasStudentDormitory(
  student: Pick<
    Student,
    | 'assignedBedId'
    | 'assignedRoomId'
    | 'assignedDormId'
    | 'assignedDormName'
    | 'assignedRoomNumber'
    | 'assignmentStatus'
  >
): boolean {
  if (student.assignmentStatus === 'confirmed' || student.assignmentStatus === 'temporary') {
    return true;
  }
  return Boolean(
    student.assignedBedId ||
      student.assignedRoomId ||
      student.assignedDormId ||
      (student.assignedDormName && String(student.assignedDormName).trim()) ||
      (student.assignedRoomNumber && String(student.assignedRoomNumber).trim())
  );
}

export function getStudentAdmissionStatus(
  student: Pick<
    Student,
    | 'admissionStatus'
    | 'isProfileCompleted'
    | 'assignedBedId'
    | 'assignedRoomId'
    | 'assignedDormId'
    | 'assignedDormName'
    | 'assignedRoomNumber'
    | 'assignmentStatus'
  >
): StudentAdmissionStatus {
  if (student.admissionStatus === 'admitted' || student.admissionStatus === 'not_admitted') {
    return student.admissionStatus;
  }
  if (hasStudentDormitory(student) || student.isProfileCompleted) {
    return 'admitted';
  }
  return 'not_admitted';
}

export function getStudentAdmissionLabel(
  student: Pick<
    Student,
    | 'admissionStatus'
    | 'isProfileCompleted'
    | 'assignedBedId'
    | 'assignedRoomId'
    | 'assignedDormId'
    | 'assignedDormName'
    | 'assignedRoomNumber'
    | 'assignmentStatus'
  >
): string {
  return getStudentAdmissionStatus(student) === 'admitted' ? 'پذیرش شده' : 'پذیرش نشده';
}

export function computeStudentFinancialInfo(
  student: Student,
  record?: StudentFinancialRecord
): ComputedStudentFinancialInfo {
  const isDormResident = isStudentDormResident(student);
  const provinceOrigin = detectProvinceOrigin(student.province);

  const deductionRate: 45 | 25 =
    record?.deductionRate === 45 || record?.deductionRate === 25
      ? record.deductionRate
      : isDormResident
      ? 45
      : 25;

  const paymentMethod: PaymentMethod =
    record?.paymentMethod ||
    (provinceOrigin === 'out_of_province' ? 'in_person_accounting' : 'auto_payroll');

  const debtAmount = Number(record?.debtAmount || 0);
  const paidAmount = Number(record?.paidAmount || 0);

  let financialStatus: StudentFinancialStatus = record?.financialStatus || 'unreviewed';
  if (!record || record.financialStatus === 'unreviewed') {
    if (debtAmount > 0) {
      financialStatus = 'debtor';
    } else if (paymentMethod === 'in_person_accounting') {
      financialStatus = 'pending_payment';
    } else if (provinceOrigin === 'in_province') {
      financialStatus = 'auto_deducting';
    } else {
      financialStatus = 'unreviewed';
    }
  }

  return {
    isDormResident,
    deductionRate,
    provinceOrigin,
    paymentMethod,
    debtAmount,
    paidAmount,
    financialStatus,
    fiscalNote: record?.fiscalNote || '',
    documentNumber: record?.documentNumber || '',
    updatedAt: record?.updatedAt,
    updatedBy: record?.updatedBy,
  };
}

export const FINANCIAL_STATUS_LABELS: Record<StudentFinancialStatus, string> = {
  auto_deducting: 'کسر خودکار از حقوق',
  pending_payment: 'در انتظار مراجعه به حسابداری',
  debtor: 'بدهکار',
  settled: 'تسویه شده',
  unreviewed: 'نیازمند بررسی مالی',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  auto_payroll: 'درون استان اصفهان (کسر خودکار از حقوق)',
  in_person_accounting: 'خارج از استان اصفهان (مراجعه حضوری به حسابداری)',
};
