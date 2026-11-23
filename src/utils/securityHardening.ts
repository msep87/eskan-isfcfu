import { CurrentUser } from '../types';

const LOGIN_RATE_LIMIT_KEY = 'cfuis_login_rl_v1';
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // پنجره ۱۵ دقیقه‌ای بررسی تلاش‌های ناموفق
const LOGIN_FREE_ATTEMPTS = 5; // ۵ تلاش مجاز پیش از قفل موقت تدریجی
const LOCKOUT_STEPS_SEC = [30, 120, 300, 900]; // ۳۰ ثانیه ← ۲ دقیقه ← ۵ دقیقه ← ۱۵ دقیقه

const PBKDF2_PREFIX = '$pbkdf2-sha256$';
const PBKDF2_ITERATIONS = 120_000;

export function normalizeAsciiDigitsSafe(val: string): string {
  return String(val ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim();
}

/**
 * مقایسه زمان‌ثابت (Timing-Safe) برای جلوگیری از نشت اطلاعات زمانی هنگام تطبیق رمز عبور
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const strA = String(a ?? '');
  const strB = String(b ?? '');
  const maxLen = Math.max(strA.length, strB.length);
  let diff = strA.length ^ strB.length;
  for (let i = 0; i < maxLen; i += 1) {
    const codeA = i < strA.length ? strA.charCodeAt(i) : 0;
    const codeB = i < strB.length ? strB.charCodeAt(i) : 0;
    diff |= codeA ^ codeB;
  }
  return diff === 0;
}

export function isPbkdf2Hash(stored?: string | null): boolean {
  return Boolean(stored && typeof stored === 'string' && stored.startsWith(PBKDF2_PREFIX));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * هش امن رمز عبور با PBKDF2-SHA256 و نمک تصادفی ۱۶ بایتی (Web Crypto API)
 */
export async function hashPasswordPBKDF2(plainPassword: string): Promise<string> {
  const clean = normalizeAsciiDigitsSafe(plainPassword);
  if (typeof crypto === 'undefined' || !crypto.subtle || typeof TextEncoder === 'undefined') {
    return clean;
  }
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(clean),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hashBytes = new Uint8Array(derivedBits);
  return `${PBKDF2_PREFIX}${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hashBytes)}`;
}

/**
 * بررسی رمز عبور با سازگاری کامل با هر دو حالت هش PBKDF2-SHA256 و رمزهای قدیمی (بدون قفل کردن کاربران فعلی)
 */
export async function verifyPasswordCompatible(
  inputPassword: string,
  storedPassword?: string | null
): Promise<boolean> {
  const cleanInput = normalizeAsciiDigitsSafe(inputPassword);
  const rawStored = String(storedPassword ?? '').trim();
  if (!cleanInput || !rawStored) return false;

  if (!isPbkdf2Hash(rawStored)) {
    return timingSafeEqual(cleanInput, normalizeAsciiDigitsSafe(rawStored));
  }

  if (typeof crypto === 'undefined' || !crypto.subtle || typeof TextEncoder === 'undefined') {
    return false;
  }

  try {
    // قالب: $pbkdf2-sha256$<iterations>$<saltB64>$<hashB64>
    const parts = rawStored.split('$');
    if (parts.length !== 5) return false;
    const iterations = Number(parts[2]);
    if (!Number.isFinite(iterations) || iterations < 10_000 || iterations > 1_000_000) {
      return false;
    }
    const salt = base64ToBytes(parts[3]);
    const expectedB64 = parts[4];
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(cleanInput),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    const actualB64 = bytesToBase64(new Uint8Array(derivedBits));
    return timingSafeEqual(actualB64, expectedB64);
  } catch {
    return false;
  }
}

// =========================================================================
// محدودسازی نرخ تلاش ورود ناموفق (Brute-Force Protection + Progressive Lockout)
// =========================================================================

interface RateLimitBucket {
  failures: number[];
  lockedUntil: number;
  lockLevel: number;
}

type RateLimitStore = Record<string, RateLimitBucket>;

function readRateLimitStore(): RateLimitStore {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOGIN_RATE_LIMIT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as RateLimitStore) : {};
  } catch {
    return {};
  }
}

function writeRateLimitStore(store: RateLimitStore): void {
  if (typeof localStorage === 'undefined') return;
  try {
    // حذف ورودی‌های منقضی‌شده برای سبک نگه داشتن localStorage
    const now = Date.now();
    const cleaned: RateLimitStore = {};
    for (const [k, v] of Object.entries(store)) {
      if (!v || typeof v !== 'object') continue;
      const recent = Array.isArray(v.failures)
        ? v.failures.filter((ts) => typeof ts === 'number' && now - ts < LOGIN_WINDOW_MS)
        : [];
      if (recent.length > 0 || (typeof v.lockedUntil === 'number' && v.lockedUntil > now)) {
        cleaned[k] = {
          failures: recent,
          lockedUntil: typeof v.lockedUntil === 'number' ? v.lockedUntil : 0,
          lockLevel: typeof v.lockLevel === 'number' ? v.lockLevel : 0,
        };
      }
    }
    localStorage.setItem(LOGIN_RATE_LIMIT_KEY, JSON.stringify(cleaned));
  } catch {
    // ignore quota errors
  }
}

function buildRateLimitKey(scope: 'student' | 'staff' | 'admin', identifier: string): string {
  const cleanId = normalizeAsciiDigitsSafe(identifier).toLowerCase().slice(0, 64) || 'unknown';
  return `${scope}:${cleanId}`;
}

export function formatPersianCountdown(seconds: number): string {
  const s = Math.max(1, Math.ceil(seconds));
  const toFa = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)] || d);
  if (s < 60) return `${toFa(s)} ثانیه`;
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${toFa(mins)} دقیقه و ${toFa(rem)} ثانیه` : `${toFa(mins)} دقیقه`;
}

export function checkLoginRateLimit(
  scope: 'student' | 'staff' | 'admin',
  identifier: string
): {
  allowed: boolean;
  retryAfterSec: number;
  remainingAttempts: number;
  message?: string;
} {
  const key = buildRateLimitKey(scope, identifier);
  const store = readRateLimitStore();
  const bucket = store[key];
  const now = Date.now();

  if (!bucket) {
    return { allowed: true, retryAfterSec: 0, remainingAttempts: LOGIN_FREE_ATTEMPTS };
  }

  if (bucket.lockedUntil > now) {
    const retryAfterSec = Math.ceil((bucket.lockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfterSec,
      remainingAttempts: 0,
      message: `به دلیل تلاش‌های ناموفق متوالی، ورود برای این شناسه موقتاً محدود شده است. لطفاً ${formatPersianCountdown(retryAfterSec)} دیگر دوباره تلاش کنید.`,
    };
  }

  const recentFailures = bucket.failures.filter((ts) => now - ts < LOGIN_WINDOW_MS);
  return {
    allowed: true,
    retryAfterSec: 0,
    remainingAttempts: Math.max(1, LOGIN_FREE_ATTEMPTS - recentFailures.length),
  };
}

export function recordLoginFailure(
  scope: 'student' | 'staff' | 'admin',
  identifier: string
): {
  locked: boolean;
  retryAfterSec: number;
  remainingAttempts: number;
  message?: string;
} {
  const key = buildRateLimitKey(scope, identifier);
  const store = readRateLimitStore();
  const now = Date.now();
  const existing = store[key] || { failures: [], lockedUntil: 0, lockLevel: 0 };
  const recentFailures = [
    ...existing.failures.filter((ts) => now - ts < LOGIN_WINDOW_MS),
    now,
  ];

  let lockedUntil = existing.lockedUntil;
  let lockLevel = existing.lockLevel;
  let locked = false;
  let retryAfterSec = 0;

  if (recentFailures.length >= LOGIN_FREE_ATTEMPTS) {
    const stepIdx = Math.min(lockLevel, LOCKOUT_STEPS_SEC.length - 1);
    retryAfterSec = LOCKOUT_STEPS_SEC[stepIdx];
    lockedUntil = now + retryAfterSec * 1000;
    lockLevel = Math.min(lockLevel + 1, LOCKOUT_STEPS_SEC.length - 1);
    locked = true;
  }

  store[key] = {
    failures: recentFailures,
    lockedUntil,
    lockLevel,
  };
  writeRateLimitStore(store);

  const remainingAttempts = Math.max(0, LOGIN_FREE_ATTEMPTS - recentFailures.length);
  return {
    locked,
    retryAfterSec,
    remainingAttempts,
    message: locked
      ? `تعداد تلاش‌های ناموفق از حد مجاز گذشت. جهت حفاظت از حساب کاربری، ورود به مدت ${formatPersianCountdown(retryAfterSec)} قفل شد.`
      : undefined,
  };
}

export function clearLoginFailures(
  scope: 'student' | 'staff' | 'admin',
  identifier: string
): void {
  const key = buildRateLimitKey(scope, identifier);
  const store = readRateLimitStore();
  if (key in store) {
    delete store[key];
    writeRateLimitStore(store);
  }
}

// =========================================================================
// پاکسازی رمزهای عبور از نشست ذخیره شده و اعتبارسنجی ساختار نشست
// =========================================================================

const ALLOWED_ROLES = new Set([
  'student',
  'supervisor',
  'admin',
  'maintenance',
  'warehouse',
  'procurement',
  'counselor',
  'finance',
  'education',
  'cultural',
  'student_affairs',
  'security',
  'vice_dean',
  'library',
  'smart_campus',
  'graduation',
]);

function omitPasswordField<T extends object>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = { ...(obj as Record<string, unknown>) };
  if ('password' in copy) {
    delete copy.password;
  }
  return copy as T;
}

/**
 * حذف فیلد رمز عبور پیش از ذخیره شیء نشست کاربر در localStorage (بدون تغییر هیچ فیلد عملیاتی دیگر)
 */
export function sanitizeCurrentUserForStorage(user: CurrentUser): CurrentUser {
  if (!user) return null;
  if (user.role === 'student') {
    return { ...user, student: omitPasswordField(user.student) };
  }
  if (user.role === 'supervisor') {
    return { ...user, supervisor: omitPasswordField(user.supervisor) };
  }
  if (user.role === 'counselor') {
    return { ...user, counselor: omitPasswordField(user.counselor) };
  }
  if (user.role === 'maintenance') {
    return { ...user, technician: omitPasswordField(user.technician) };
  }
  if (user.role === 'admin') {
    return { role: 'admin', name: user.name, username: user.username };
  }
  return { ...user, staff: omitPasswordField(user.staff) } as CurrentUser;
}

/**
 * اعتبارسنجی ساختار نشست خوانده‌شده از localStorage جهت جلوگیری از دستکاری یا خطای زمان اجرا
 */
export function validateStoredCurrentUser(raw: unknown): CurrentUser {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  const role = typeof candidate.role === 'string' ? candidate.role : '';
  if (!ALLOWED_ROLES.has(role)) return null;

  if (role === 'admin') {
    if (typeof candidate.username !== 'string' || typeof candidate.name !== 'string') return null;
    return candidate as unknown as CurrentUser;
  }
  if (role === 'student') {
    const st = candidate.student as Record<string, unknown> | undefined;
    if (!st || typeof st.studentId !== 'string') return null;
    return candidate as unknown as CurrentUser;
  }
  if (role === 'supervisor') {
    const sup = candidate.supervisor as Record<string, unknown> | undefined;
    if (!sup || typeof sup.id !== 'string') return null;
    return candidate as unknown as CurrentUser;
  }
  if (role === 'counselor') {
    const cns = candidate.counselor as Record<string, unknown> | undefined;
    if (!cns || typeof cns.id !== 'string') return null;
    return candidate as unknown as CurrentUser;
  }
  if (role === 'maintenance') {
    const tech = candidate.technician as Record<string, unknown> | undefined;
    if (!tech || typeof tech.id !== 'string') return null;
    return candidate as unknown as CurrentUser;
  }
  const staff = candidate.staff as Record<string, unknown> | undefined;
  if (!staff || typeof staff.id !== 'string') return null;
  return candidate as unknown as CurrentUser;
}

/**
 * حذف فیلدهای احراز هویت (password / username) از فهرست مشاوران هنگام کش کردن در نشست دانشجو
 */
export function stripCredentialsFromStaffArray<T>(items: T): T {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const copy = { ...(item as Record<string, unknown>) };
    delete copy.password;
    delete copy.username;
    return copy;
  }) as unknown as T;
}

/**
 * محاسبه زنجیره اثرانگشت سبک (Tamper-Evident Chain Hash) برای رکوردهای گزارش ممیزی (ActivityLog)
 */
export function computeAuditChainHash(
  prevHash: string | undefined,
  fields: {
    id: string;
    timestamp: string;
    actorRole: string;
    actorUsername?: string;
    category: string;
    action: string;
    details: string;
  }
): string {
  const payload = [
    prevHash || 'GENESIS',
    fields.id,
    fields.timestamp,
    fields.actorRole,
    fields.actorUsername || '',
    fields.category,
    fields.action,
    fields.details.slice(0, 200),
  ].join('|');

  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0; i < payload.length; i += 1) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}
