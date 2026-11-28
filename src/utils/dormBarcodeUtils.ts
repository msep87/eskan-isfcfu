import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import {
  DormAttendanceStateRecord,
  DormAttendanceStatus,
  Student,
} from '../types';

export const DORM_BARCODE_PREFIX = 'CFUD:';

export const DORM_ATTENDANCE_STATUS_META: Record<
  DormAttendanceStatus,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    pillActiveClass: string;
    dotClass: string;
  }
> = {
  present: {
    label: 'حاضر در سرا',
    shortLabel: 'حاضر',
    badgeClass:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
    pillActiveClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    dotClass: 'bg-emerald-500',
  },
  out: {
    label: 'خارج از سرا (تردد)',
    shortLabel: 'خارج از سرا',
    badgeClass:
      'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700',
    pillActiveClass: 'bg-sky-600 text-white border-sky-600 shadow-xs',
    dotClass: 'bg-sky-500',
  },
  leave: {
    label: 'در مرخصی',
    shortLabel: 'مرخصی',
    badgeClass:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
    pillActiveClass: 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs',
    dotClass: 'bg-amber-500',
  },
  absent: {
    label: 'غایب / تأخیر',
    shortLabel: 'غایب',
    badgeClass:
      'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700',
    pillActiveClass: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    dotClass: 'bg-rose-500',
  },
};

export function toAsciiDigits(input: string | number | undefined | null): string {
  const s = String(input ?? '');
  return s
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * تبدیل نویسه‌های احتمالی صفحه‌کلید فارسی هنگام ورود با بارکدخوان سخت‌افزاری USB
 */
const PERSIAN_TO_US_KEY_MAP: Record<string, string> = {
  ض: 'q',
  ص: 'w',
  ث: 'e',
  ق: 'r',
  ف: 't',
  غ: 'y',
  ع: 'u',
  ه: 'i',
  خ: 'o',
  ح: 'p',
  ش: 'a',
  س: 's',
  ی: 'd',
  ب: 'f',
  ل: 'g',
  ا: 'h',
  ت: 'j',
  ن: 'k',
  م: 'l',
  ظ: 'z',
  ط: 'x',
  ز: 'c',
  ر: 'v',
  ذ: 'b',
  د: 'n',
  ئ: 'm',
  ك: ';',
  ک: ';',
};

export function normalizeScannerInput(raw: string): string {
  const mapped = Array.from(toAsciiDigits(raw).trim())
    .map((ch) => PERSIAN_TO_US_KEY_MAP[ch] || ch)
    .join('');
  return mapped.replace(/\s+/g, '');
}

/**
 * کد یکتای استاندارد برای بارکد خطی Code-128 روی کارت خوابگاه دانشجو
 * (صرفاً ارقام/حروف استاندارد انگلیسی تا همه اسکنرهای ۱بعدی و ۲بعدی بدون خطا بخوانند)
 */
export function getStudentCardBarcodeValue(student: Student): string {
  const stId = toAsciiDigits(student.studentId).replace(/[^A-Za-z0-9_-]/g, '');
  if (stId) return stId;
  const nat = toAsciiDigits(student.nationalId).replace(/[^A-Za-z0-9_-]/g, '');
  if (nat) return nat;
  return '0000';
}

export function getStudentCardQrPayload(student: Student): string {
  return `${DORM_BARCODE_PREFIX}${getStudentCardBarcodeValue(student)}`;
}

export function findStudentByScannedBarcode(
  rawInput: string,
  students: Student[]
): { student?: Student; normalizedCode: string } {
  const cleaned = normalizeScannerInput(rawInput);
  if (!cleaned) return { normalizedCode: '' };

  let stripped = cleaned;
  const upper = stripped.toUpperCase();
  if (upper.startsWith('CFUD:') || upper.startsWith('CFUD-') || upper.startsWith('CFUD;')) {
    stripped = stripped.slice(5);
  } else if (upper.startsWith('STU:') || upper.startsWith('STU-')) {
    stripped = stripped.slice(4);
  }

  const candidateLower = stripped.toLowerCase();
  const candidateNoLeadingZeros = stripped.replace(/^0+/, '');

  const match = students.find((s) => {
    const barcodeVal = getStudentCardBarcodeValue(s).toLowerCase();
    const sid = toAsciiDigits(s.studentId).trim().toLowerCase();
    const nid = toAsciiDigits(s.nationalId).trim().toLowerCase();
    if (
      barcodeVal === candidateLower ||
      sid === candidateLower ||
      nid === candidateLower
    ) {
      return true;
    }
    if (
      candidateNoLeadingZeros &&
      (sid.replace(/^0+/, '') === candidateNoLeadingZeros ||
        nid.replace(/^0+/, '') === candidateNoLeadingZeros)
    ) {
      return true;
    }
    return false;
  });

  return { student: match, normalizedCode: stripped || cleaned };
}

export async function generateQrCodeDataUrl(
  payload: string,
  width = 160
): Promise<string> {
  return QRCode.toDataURL(payload, {
    width,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

export function renderCode128ToSvg(
  svgEl: SVGSVGElement | null,
  value: string,
  options?: {
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
  }
): boolean {
  if (!svgEl || !value) return false;
  try {
    JsBarcode(svgEl, value, {
      format: 'CODE128',
      width: options?.width ?? 1.45,
      height: options?.height ?? 28,
      displayValue: options?.displayValue ?? false,
      fontSize: options?.fontSize ?? 10,
      margin: options?.margin ?? 4,
      background: '#ffffff',
      lineColor: '#0f172a',
    });
    return true;
  } catch {
    return false;
  }
}

export function buildCode128SvgMarkup(
  value: string,
  options?: { width?: number; height?: number; margin?: number }
): string {
  if (typeof document === 'undefined' || !value) return '';
  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg, value, {
      format: 'CODE128',
      width: options?.width ?? 1.35,
      height: options?.height ?? 28,
      displayValue: true,
      fontSize: 9,
      margin: options?.margin ?? 4,
      background: '#ffffff',
      lineColor: '#0f172a',
    });
    svg.setAttribute('style', 'max-width:100%;height:auto;display:block;margin:0 auto;');
    return svg.outerHTML;
  } catch {
    return '';
  }
}

export function getEffectiveDormAttendanceStatus(
  studentId: string,
  statesMap: Map<string, DormAttendanceStateRecord>
): DormAttendanceStatus {
  return statesMap.get(studentId)?.status || 'present';
}

export function playBarcodeScanTone(kind: 'success' | 'warning' | 'error'): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (kind === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046, ctx.currentTime);
      osc.frequency.setValueAtTime(1318, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.17);
    } else if (kind === 'warning') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.19);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 350);
  } catch {
    // ignore Web Audio failure
  }
}
