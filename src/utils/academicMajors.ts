import {
  AcademicDegreeLevel,
  AppSettings,
  ApprovedAcademicMajor,
  Student,
} from '../types';

export const DEFAULT_ACADEMIC_DEGREE_LEVELS: AcademicDegreeLevel[] = [
  { id: 'deg_ba_cont', name: 'کارشناسی پیوسته', code: 'BA', isActive: true },
  { id: 'deg_ba_noncont', name: 'کارشناسی ناپیوسته', code: 'BA-N', isActive: true },
  { id: 'deg_ma', name: 'کارشناسی ارشد', code: 'MA', isActive: true },
  { id: 'deg_phd', name: 'دکتری تخصصی', code: 'PhD', isActive: true },
  { id: 'deg_m28', name: 'دوره مهارت‌آموزی (ماده ۲۸)', code: 'M28', isActive: true },
  { id: 'deg_aa', name: 'کاردانی', code: 'AA', isActive: true },
];

export function toAsciiDigitsSafe(raw?: string | number | null): string {
  return String(raw ?? '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export function normalizeMajorCode(raw?: string | number | null): string {
  return toAsciiDigitsSafe(raw)
    .replace(/[\s\-_]/g, '')
    .trim();
}

export function normalizeMajorText(raw?: string | null): string {
  return toAsciiDigitsSafe(raw)
    .replace(/\u200c|\u200f|\u200e/g, ' ')
    .replace(/[\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[يئ]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/[()\[\]«»"'،,.\-_/\\:;!?؟]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function stripNoisyMajorPrefixes(norm: string): string {
  return norm
    .replace(/^(رشته تحصیلی|رشته|مقطع تحصیلی|مقطع|دوره|کارشناسی پیوسته|کارشناسی ناپیوسته|کارشناسی ارشد|کارشناسی|دکتری تخصصی|دکتری|دبیری|آموزش و پرورش)\s+/g, '')
    .replace(/\s+(پیوسته|ناپیوسته)$/g, '')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function diceSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const s1 = a.replace(/\s+/g, '');
  const s2 = b.replace(/\s+/g, '');
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) {
    return s1 === s2 ? 1 : 0;
  }

  const bigrams = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.slice(i, i + 2);
    bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.slice(i, i + 2);
    const count = bigrams.get(bg) || 0;
    if (count > 0) {
      bigrams.set(bg, count - 1);
      intersection++;
    }
  }
  return (2 * intersection) / (s1.length - 1 + (s2.length - 1));
}

function tokenJaccardSimilarity(a: string, b: string): number {
  const tokensA = a.split(' ').filter(Boolean);
  const tokensB = b.split(' ').filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  let matched = 0;
  for (const ta of tokensA) {
    let bestToken = 0;
    for (const tb of tokensB) {
      if (ta === tb) {
        bestToken = 1;
        break;
      }
      if (ta.length >= 3 && tb.length >= 3 && (ta.includes(tb) || tb.includes(ta))) {
        bestToken = Math.max(bestToken, 0.85);
      } else {
        const maxLen = Math.max(ta.length, tb.length);
        const dist = levenshteinDistance(ta, tb);
        const sim = maxLen > 0 ? 1 - dist / maxLen : 0;
        if (sim >= 0.72) bestToken = Math.max(bestToken, sim);
      }
    }
    matched += bestToken;
  }

  const unionApprox = Math.max(tokensA.length, tokensB.length);
  return unionApprox > 0 ? matched / unionApprox : 0;
}

export interface MajorMatchResult {
  major: ApprovedAcademicMajor;
  score: number; // 0..100
  reason: string;
}

export function computeMajorSimilarityScore(
  rawNameOrCode: string,
  major: ApprovedAcademicMajor,
  rawCode?: string
): { score: number; reason: string } {
  const normMajorCode = normalizeMajorCode(major.code);
  const cleanIncomingCode = normalizeMajorCode(rawCode);
  if (normMajorCode && cleanIncomingCode && normMajorCode === cleanIncomingCode) {
    return { score: 100, reason: 'تطابق دقیق کد رشته' };
  }

  const normRaw = normalizeMajorText(rawNameOrCode);
  if (!normRaw) return { score: 0, reason: '' };

  if (normMajorCode && normalizeMajorCode(rawNameOrCode) === normMajorCode) {
    return { score: 100, reason: 'تطابق دقیق با کد رشته' };
  }

  const normTarget = normalizeMajorText(major.name);
  if (!normTarget) return { score: 0, reason: '' };

  if (normRaw === normTarget) {
    return { score: 100, reason: 'تطابق دقیق نام رشته' };
  }

  if (normRaw.replace(/\s+/g, '') === normTarget.replace(/\s+/g, '')) {
    return { score: 99, reason: 'تطابق بدون فاصله' };
  }

  const aliases = (major.aliases || []).map((a) => normalizeMajorText(a)).filter(Boolean);
  for (const alias of aliases) {
    if (normRaw === alias || normRaw.replace(/\s+/g, '') === alias.replace(/\s+/g, '')) {
      return { score: 98, reason: 'تطابق با عنوان جایگزین ثبت‌شده' };
    }
  }

  // مقایسه با حذف پیشوندهای زائد مثل "رشته"، "کارشناسی"، ...
  const strippedRaw = stripNoisyMajorPrefixes(normRaw);
  const strippedTarget = stripNoisyMajorPrefixes(normTarget);
  if (strippedRaw && strippedTarget && strippedRaw === strippedTarget) {
    return { score: 94, reason: 'تطابق پس از حذف پیشوند/مقطع' };
  }

  // مقایسه با همه کاندیداها (نام رسمی و نام‌های جایگزین)
  const candidates = [normTarget, strippedTarget, ...aliases].filter(Boolean);
  let bestScore = 0;

  for (const cand of candidates) {
    const compactRaw = (strippedRaw || normRaw).replace(/\s+/g, '');
    const compactCand = cand.replace(/\s+/g, '');

    const maxLen = Math.max(compactRaw.length, compactCand.length);
    const lev = maxLen > 0 ? 1 - levenshteinDistance(compactRaw, compactCand) / maxLen : 0;
    const dice = diceSimilarity(strippedRaw || normRaw, cand);
    const jac = tokenJaccardSimilarity(strippedRaw || normRaw, cand);

    let containmentBonus = 0;
    if (compactRaw.length >= 4 && compactCand.length >= 4) {
      if (compactCand.includes(compactRaw) || compactRaw.includes(compactCand)) {
        containmentBonus = 0.14;
      }
    }

    const combined = Math.min(
      0.95,
      Math.max(lev * 0.42 + dice * 0.33 + jac * 0.25 + containmentBonus, jac * 0.72 + dice * 0.28)
    );
    const pct = Math.round(combined * 100);
    if (pct > bestScore) bestScore = pct;
  }

  return {
    score: Math.max(0, Math.min(95, bestScore)),
    reason: bestScore >= 75 ? 'تشابه بالای نوشتاری' : bestScore >= 45 ? 'تشابه نسبی' : 'تشابه ضعیف',
  };
}

export function findClosestApprovedMajor(
  rawName: string,
  majors: ApprovedAcademicMajor[],
  rawCode?: string
): MajorMatchResult | null {
  const pool = majors.filter((m) => m.isActive !== false);
  const searchPool = pool.length > 0 ? pool : majors;
  if (searchPool.length === 0) return null;

  let best: MajorMatchResult | null = null;
  for (const major of searchPool) {
    const { score, reason } = computeMajorSimilarityScore(rawName, major, rawCode);
    if (!best || score > best.score) {
      best = { major, score, reason };
    }
  }
  return best;
}

export function getEffectiveDegreeLevels(
  settings?: Partial<AppSettings> | null,
  includeInactive = false
): AcademicDegreeLevel[] {
  const list =
    settings?.academicDegreeLevels && settings.academicDegreeLevels.length > 0
      ? settings.academicDegreeLevels
      : DEFAULT_ACADEMIC_DEGREE_LEVELS;
  return includeInactive ? list : list.filter((d) => d.isActive !== false);
}

export function getEffectiveApprovedMajors(
  settings?: Partial<AppSettings> | null,
  includeInactive = false
): ApprovedAcademicMajor[] {
  const list = Array.isArray(settings?.approvedMajors) ? settings!.approvedMajors : [];
  const filtered = includeInactive ? list : list.filter((m) => m.isActive !== false);
  return [...filtered].sort((a, b) => {
    const degCmp = (a.degreeLevelName || '').localeCompare(b.degreeLevelName || '', 'fa');
    if (degCmp !== 0) return degCmp;
    return (a.name || '').localeCompare(b.name || '', 'fa');
  });
}

export function formatApprovedMajorLabel(m: ApprovedAcademicMajor): string {
  const codePart = m.code ? `کد ${m.code}` : '';
  const degPart = m.degreeLevelName || '';
  const meta = [codePart, degPart].filter(Boolean).join(' — ');
  return meta ? `${m.name} (${meta})` : m.name;
}

export function findExactApprovedMajorForStudent(
  student: Pick<Student, 'fieldOfStudy' | 'majorCode'>,
  majors: ApprovedAcademicMajor[]
): ApprovedAcademicMajor | undefined {
  const stCode = normalizeMajorCode(student.majorCode);
  const stField = (student.fieldOfStudy || '').trim();
  if (stCode) {
    const byCode = majors.find(
      (m) => normalizeMajorCode(m.code) === stCode && m.name.trim() === stField
    );
    if (byCode) return byCode;
  }
  return majors.find((m) => m.name.trim() === stField);
}
