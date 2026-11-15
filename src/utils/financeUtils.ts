import { Student, StudentFinancialRecord, StudentFinancialStatus } from '../types';
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

export function isStudentDormResident(student: Student): boolean {
  return Boolean(student.assignedBedId && student.assignmentStatus !== 'none');
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
