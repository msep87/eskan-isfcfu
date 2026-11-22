import {
  CommunityChatSettings,
  CommunityForum,
  CommunityForumCategory,
  Student,
} from '../types';
import { isStudentDormResident } from './financeUtils';

export const PUBLIC_FORUM_ID = 'public_forum';

export const DEFAULT_COMMUNITY_RULES_TEXT = `منشور اخلاقی و قوانین تالارهای گفتگو و پیام‌رسان دانشجویی دانشگاه فرهنگیان اصفهان:

۱. هرگونه بحث، جدل یا تبلیغات سیاسی، حزبی و جناحی در تالار عمومی، گروه‌های تخصصی و چت‌های خصوصی اکیداً ممنوع است.
۲. رعایت کامل شأن دانشجومعلمی، ادب، احترام متقابل و ضوابط اخلاقی و اسلامی الزامی بوده و هرگونه توهین، تهمت، افترا، تمسخر یا مزاحمت پیگرد انضباطی و حراستی دارد.
۳. انتشار اخبار کذب، شایعات، محتوای غیرقانونی، تصاویر نامتعارف، تبلیغات تجاری یا اطلاعات محرمانه دانشگاه ممنوع است.
۴. کلیه پیام‌ها، تصاویر و فعالیت‌ها در تالارها، گروه‌ها و گفتگوها ثبت شده و تحت نظارت مستقیم مدیریت سامانه، معاونت دانشجویی و واحد حراست قرار دارد.
۵. در صورت مشاهده تخلف، مدیر و واحد حراست مجاز به حذف پیام، ثبت اخطار رسمی، مسدودسازی فوری حساب کاربری در پیام‌رسان و ارجاع به شورای انضباطی هستند.`;

export const DEFAULT_COMMUNITY_CHAT_SETTINGS: CommunityChatSettings = {
  isChatSystemEnabled: true,
  isPublicForumOpen: true,
  isPrivateChatEnabled: false, // به‌صورت پیش‌فرض بسته تا مدیر در صورت صلاحدید باز کند
  isStaffChatEnabled: true, // چت خصوصی و تالارهای داخلی کارکنان به‌صورت پیش‌فرض فعال
  isGroupCreationEnabled: true,
  allowPhotosInForums: false, // ارسال عکس صرفاً با تأیید مدیر
  allowPhotosInPrivateChat: false,
  allowStickers: false, // ارسال استیکر صرفاً با تأیید مدیر
  allowVoiceMessages: true, // ضبط و ارسال پیام صوتی (ویس)
  allowLiveVoiceCall: true, // گفتگوی صوتی مستقیم زنده (کلید سراسری)
  voiceCallBlockedRoles: [], // نقش‌هایی که دسترسی تماس صوتی آن‌ها مسدود است
  requireRulesAcceptance: true,
  onlyAdmittedStudentsCanChat: false,
  privateChatScope: 'all',
  bannedKeywords: ['توهین', 'فحش', 'هرزنامه'],
  rulesText: DEFAULT_COMMUNITY_RULES_TEXT,
  publicForumNotice:
    'به تالار گفتگوی عمومی دانشگاه فرهنگیان اصفهان خوش آمدید. لطفاً شأن دانشجومعلمی را رعایت نموده و از طرح مباحث سیاسی یا غیرمرتبط پرهیز نمایید.',
};

export const INITIAL_PUBLIC_FORUM: CommunityForum = {
  id: PUBLIC_FORUM_ID,
  isPublicForum: true,
  title: 'تالار گفتگوی عمومی دانشگاه',
  description:
    'فضای گفتگوی عمومی همه دانشجویان و کاربران سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان اصفهان (باز و بسته شدن ارسال پیام توسط مدیر سامانه کنترل می‌شود).',
  category: 'public',
  tags: ['عمومی', 'دانشگاه_فرهنگیان', 'اطلاع‌رسانی'],
  avatarColor: 'from-teal-500 to-emerald-600',
  creatorId: 'admin',
  creatorName: 'مدیریت کل سامانه',
  creatorRole: 'admin',
  status: 'active',
  isClosed: false,
  adminApproval: {
    status: 'approved',
    byName: 'مدیریت کل سامانه',
    at: 'سیستمی',
  },
  securityApproval: {
    status: 'approved',
    byName: 'واحد حراست و انتظامات',
    at: 'سیستمی',
  },
  allowedFields: [],
  allowedEntryTerms: [],
  allowedResidence: 'all',
  memberIds: [],
  rulesAcceptedByCreator: true,
  createdAt: '۱۴۰۵/۰۱/۰۱',
};

export const FORUM_CATEGORIES_META: Record<
  CommunityForumCategory,
  { label: string; badgeClass: string; gradient: string }
> = {
  public: {
    label: 'تالار عمومی',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300',
    gradient: 'from-teal-500 to-emerald-600',
  },
  scientific: {
    label: 'علمی و آموزشی',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300',
    gradient: 'from-sky-500 to-blue-600',
  },
  cultural: {
    label: 'فرهنگی و هنری',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/70 dark:text-fuchsia-300',
    gradient: 'from-fuchsia-500 to-purple-600',
  },
  sports: {
    label: 'ورزشی و تربیت بدنی',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
    gradient: 'from-emerald-500 to-green-600',
  },
  association: {
    label: 'انجمن علمی / کانون',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300',
    gradient: 'from-indigo-500 to-violet-600',
  },
  guild: {
    label: 'صنفی و دانشجویی',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
    gradient: 'from-amber-500 to-orange-600',
  },
  dormitory: {
    label: 'سراها و خوابگاهی',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300',
    gradient: 'from-cyan-500 to-teal-600',
  },
  other: {
    label: 'تخصصی / سایر',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    gradient: 'from-slate-500 to-slate-700',
  },
};

export interface CommunityStickerItem {
  id: string;
  emoji: string;
  label: string;
  bgGradient: string;
  borderColor: string;
}

export const COMMUNITY_STICKERS: CommunityStickerItem[] = [
  {
    id: 'salam',
    emoji: '🌿',
    label: 'سلام و احترام',
    bgGradient: 'from-emerald-50 to-teal-100 dark:from-emerald-950/80 dark:to-teal-900/60',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'khaste_nabashid',
    emoji: '☕',
    label: 'خسته نباشید',
    bgGradient: 'from-amber-50 to-orange-100 dark:from-amber-950/80 dark:to-orange-900/60',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'tashakor',
    emoji: '🙏',
    label: 'سپاسگزارم',
    bgGradient: 'from-sky-50 to-blue-100 dark:from-sky-950/80 dark:to-blue-900/60',
    borderColor: 'border-sky-200 dark:border-sky-800',
  },
  {
    id: 'movafagh',
    emoji: '🎓',
    label: 'موفق باشید',
    bgGradient: 'from-indigo-50 to-violet-100 dark:from-indigo-950/80 dark:to-violet-900/60',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'aalie',
    emoji: '👏',
    label: 'بسیار عالی',
    bgGradient: 'from-teal-50 to-cyan-100 dark:from-teal-950/80 dark:to-cyan-900/60',
    borderColor: 'border-teal-200 dark:border-teal-800',
  },
  {
    id: 'nokteh',
    emoji: '📌',
    label: 'نکته مهم',
    bgGradient: 'from-rose-50 to-pink-100 dark:from-rose-950/80 dark:to-pink-900/60',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
  {
    id: 'soal',
    emoji: '❓',
    label: 'سؤال دارم',
    bgGradient: 'from-amber-50 to-yellow-100 dark:from-amber-950/80 dark:to-yellow-900/60',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hamfekri',
    emoji: '💡',
    label: 'پیشنهاد خوب',
    bgGradient: 'from-yellow-50 to-amber-100 dark:from-yellow-950/80 dark:to-amber-900/60',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  {
    id: 'tabrik',
    emoji: '🎉',
    label: 'تبریک صمیمانه',
    bgGradient: 'from-fuchsia-50 to-purple-100 dark:from-fuchsia-950/80 dark:to-purple-900/60',
    borderColor: 'border-fuchsia-200 dark:border-fuchsia-800',
  },
  {
    id: 'ketab',
    emoji: '📚',
    label: 'وقت مطالعه',
    bgGradient: 'from-blue-50 to-indigo-100 dark:from-blue-950/80 dark:to-indigo-900/60',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'taeed',
    emoji: '✅',
    label: 'تأیید و همراهی',
    bgGradient: 'from-green-50 to-emerald-100 dark:from-green-950/80 dark:to-emerald-900/60',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    id: 'yadavari',
    emoji: '⏰',
    label: 'یادآوری دوستانه',
    bgGradient: 'from-cyan-50 to-sky-100 dark:from-cyan-950/80 dark:to-sky-900/60',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  {
    id: 'moallem',
    emoji: '✏️',
    label: 'منش معلمی',
    bgGradient: 'from-violet-50 to-indigo-100 dark:from-violet-950/80 dark:to-indigo-900/60',
    borderColor: 'border-violet-200 dark:border-violet-800',
  },
  {
    id: 'varzesh',
    emoji: '⚽',
    label: 'نشاط و ورزش',
    bgGradient: 'from-lime-50 to-emerald-100 dark:from-lime-950/80 dark:to-emerald-900/60',
    borderColor: 'border-lime-200 dark:border-lime-800',
  },
  {
    id: 'hamkari',
    emoji: '🤝',
    label: 'همدلی و همکاری',
    bgGradient: 'from-teal-50 to-emerald-100 dark:from-teal-950/80 dark:to-emerald-900/60',
    borderColor: 'border-teal-200 dark:border-teal-800',
  },
  {
    id: 'gol',
    emoji: '🌷',
    label: 'تقدیم با احترام',
    bgGradient: 'from-pink-50 to-rose-100 dark:from-pink-950/80 dark:to-rose-900/60',
    borderColor: 'border-pink-200 dark:border-pink-800',
  },
];

export function getStickerById(id?: string): CommunityStickerItem | undefined {
  if (!id) return undefined;
  return COMMUNITY_STICKERS.find((s) => s.id === id);
}

export function makeDmRoomId(studentIdA: string, studentIdB: string): string {
  const sorted = [studentIdA.trim(), studentIdB.trim()].sort((a, b) => a.localeCompare(b));
  return `dm_${sorted[0]}_${sorted[1]}`;
}

export function makeStaffDmRoomId(staffIdA: string, staffIdB: string): string {
  const sorted = [staffIdA.trim(), staffIdB.trim()].sort((a, b) => a.localeCompare(b));
  return `staff_dm_${sorted[0]}_${sorted[1]}`;
}

export function isStaffDmRoomId(roomId?: string | null): boolean {
  return Boolean(roomId && roomId.startsWith('staff_dm_'));
}

export const STAFF_ROLE_OPTIONS: { role: string; label: string }[] = [
  { role: 'admin', label: 'مدیر کل سامانه' },
  { role: 'vice_dean', label: 'معاونت دانشجویی' },
  { role: 'security', label: 'حراست و انتظامات' },
  { role: 'supervisor', label: 'سرپرستان سراها' },
  { role: 'student_affairs', label: 'امور دانشجویی و تربیت بدنی' },
  { role: 'cultural', label: 'امور فرهنگی' },
  { role: 'education', label: 'واحد آموزش' },
  { role: 'counselor', label: 'مرکز مشاوره' },
  { role: 'finance', label: 'امور مالی و حسابداری' },
  { role: 'library', label: 'کتابخانه و پژوهش' },
  { role: 'smart_campus', label: 'واحد هوشمندسازی' },
  { role: 'graduation', label: 'واحد فارغ‌التحصیلان' },
  { role: 'maintenance', label: 'تأسیسات و فنی' },
  { role: 'warehouse', label: 'انبار و تجهیزات' },
  { role: 'procurement', label: 'کارپردازی و خرید' },
];

export const ALL_VOICE_CALL_ROLE_OPTIONS: { role: string; label: string; group: 'student' | 'staff' }[] = [
  { role: 'student', label: 'دانشجویان', group: 'student' },
  ...STAFF_ROLE_OPTIONS.map((item) => ({ ...item, group: 'staff' as const })),
];

export function canRoleUseLiveVoiceCall(
  settings: CommunityChatSettings,
  role?: string | null
): { allowed: boolean; reason?: string } {
  if (!settings.isChatSystemEnabled) {
    return {
      allowed: false,
      reason: 'کل سامانه گفتگو و تماس صوتی توسط مدیر کل بسته شده است.',
    };
  }
  if (settings.allowLiveVoiceCall === false) {
    return {
      allowed: false,
      reason: 'امکان برقراری تماس صوتی مستقیم برای همه کاربران توسط مدیر کل بسته شده است.',
    };
  }
  const normalizedRole = (role || '').trim();
  if (
    normalizedRole &&
    Array.isArray(settings.voiceCallBlockedRoles) &&
    settings.voiceCallBlockedRoles.includes(normalizedRole)
  ) {
    return {
      allowed: false,
      reason: `دسترسی به تماس صوتی مستقیم برای کاربری «${getRoleDisplayLabel(normalizedRole)}» توسط مدیر کل بسته شده است.`,
    };
  }
  return { allowed: true };
}

export function isStaffEligibleForForum(
  staffRole: string,
  staffId: string,
  forum: CommunityForum
): boolean {
  if (staffRole === 'student') return false;
  if (forum.audienceType !== 'staff_only') return true;
  if (staffRole === 'admin' || staffRole === 'security' || staffRole === 'vice_dean') return true;
  if (forum.creatorId === staffId) return true;
  if (!Array.isArray(forum.allowedStaffRoles) || forum.allowedStaffRoles.length === 0) return true;
  return forum.allowedStaffRoles.includes(staffRole);
}

export function isStudentEligibleForForum(
  student: Student,
  forum: CommunityForum
): { eligible: boolean; reason?: string } {
  if (forum.audienceType === 'staff_only') {
    return {
      eligible: false,
      reason: 'این تالار یا گروه ویژه کارکنان دانشگاه فرهنگیان است.',
    };
  }
  if (forum.isPublicForum || forum.id === PUBLIC_FORUM_ID) {
    return { eligible: true };
  }
  // سازنده تالار همیشه مجاز است
  if (forum.creatorId === student.studentId) {
    return { eligible: true };
  }
  // بررسی نوع سکونت (خوابگاهی / ترددی)
  const resident = isStudentDormResident(student);
  if (forum.allowedResidence === 'dormitory' && !resident) {
    return {
      eligible: false,
      reason: 'این تالار ویژه دانشجویان خوابگاهی تعریف شده است.',
    };
  }
  if (forum.allowedResidence === 'commuter' && resident) {
    return {
      eligible: false,
      reason: 'این تالار ویژه دانشجویان ترددی تعریف شده است.',
    };
  }
  // بررسی رشته تحصیلی
  if (Array.isArray(forum.allowedFields) && forum.allowedFields.length > 0) {
    const stField = (student.fieldOfStudy || '').trim().toLowerCase();
    const matchedField = forum.allowedFields.some(
      (f) => f.trim().toLowerCase() === stField || stField.includes(f.trim().toLowerCase())
    );
    if (!matchedField) {
      return {
        eligible: false,
        reason: `این تالار ویژه رشته‌های: ${forum.allowedFields.join('، ')} است.`,
      };
    }
  }
  // بررسی سال/نیمسال ورودی
  if (Array.isArray(forum.allowedEntryTerms) && forum.allowedEntryTerms.length > 0) {
    const stEntry = (student.entryTerm || '').trim();
    const matchedEntry = forum.allowedEntryTerms.some(
      (e) => e.trim() === stEntry || stEntry.includes(e.trim())
    );
    if (!matchedEntry) {
      return {
        eligible: false,
        reason: `این تالار ویژه ورودی‌های: ${forum.allowedEntryTerms.join('، ')} است.`,
      };
    }
  }
  return { eligible: true };
}

/**
 * فشرده‌سازی امن و سبک تصویر ارسالی در چت (حداکثر 720px، فرمت JPEG/WebP زیر ~120KB)
 */
export async function compressChatImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('فقط فایل‌های تصویری (JPG, PNG, WebP) مجاز هستند.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('حجم فایل انتخاب‌شده بسیار زیاد است (حداکثر ۱۰ مگابایت).');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('تصویر انتخاب‌شده معتبر نیست.'));
      img.onload = () => {
        try {
          const maxDim = 720;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('مرورگر امکان پردازش تصویر را ندارد.'));
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let dataUrl = canvas.toDataURL('image/webp', 0.72);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          }
          // اگر هنوز حجم بالایی داشت کیفیت را کمی کمتر می‌کنیم
          if (dataUrl.length > 180_000) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.56);
          }
          resolve(dataUrl);
        } catch {
          reject(new Error('خطا در فشرده‌سازی تصویر.'));
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export function getRoleDisplayLabel(role: string): string {
  switch (role) {
    case 'admin':
      return 'مدیر کل سامانه';
    case 'security':
      return 'واحد حراست';
    case 'vice_dean':
      return 'معاونت دانشجویی';
    case 'supervisor':
      return 'سرپرست سرا';
    case 'education':
      return 'کارشناس آموزش';
    case 'cultural':
      return 'امور فرهنگی';
    case 'student_affairs':
      return 'امور دانشجویی';
    case 'counselor':
      return 'مرکز مشاوره';
    case 'finance':
      return 'امور مالی';
    case 'library':
      return 'کتابخانه';
    case 'smart_campus':
      return 'هوشمندسازی';
    case 'graduation':
      return 'فارغ‌التحصیلان';
    case 'maintenance':
      return 'تأسیسات و فنی';
    case 'warehouse':
      return 'انبار و تجهیزات';
    case 'procurement':
      return 'کارپردازی';
    case 'student':
      return 'دانشجو';
    default:
      return 'کاربر سامانه';
  }
}

export function isSupervisorModeratorRole(role?: string | null): boolean {
  return role === 'admin' || role === 'security' || role === 'vice_dean';
}
