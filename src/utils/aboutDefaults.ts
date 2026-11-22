import {
  AboutAttachmentFile,
  AboutCapabilityItem,
  AboutContentSettings,
} from '../types';

export interface ResolvedAboutContent {
  universityBadge: string;
  headerTitle: string;
  headerSubtitle: string;
  designerBadge: string;
  designerName: string;
  designerEmail: string;
  designerBio: string;
  designerBioHtml: string;
  pdfCardTitle: string;
  pdfCardDescription: string;
  boardingSectionTitle: string;
  boardingSectionHtml: string;
  boardingSectionText: string;
  capabilitiesSectionTitle: string;
  capabilities: AboutCapabilityItem[];
  extraSectionTitle: string;
  extraSectionHtml: string;
  extraSectionText: string;
  attachmentsTitle: string;
  attachments: AboutAttachmentFile[];
  footerNote: string;
  updatedAt?: string;
}

export const DEFAULT_ABOUT_CAPABILITIES: AboutCapabilityItem[] = [
  {
    id: 'cap_accommodation',
    text: 'اسکان و سراهای دانشجویی: سامانه هوشمند انتخاب گرافیکی اتاق و تخت (طبقه بالا/پایین)، کارت دانشجومعلمی استاندارد CR-80 با کیوآرکد اصالت، درخواست جابجایی، مهمان و انصراف از سرا با حفظ کامل حریم خصوصی هم‌اتاقی‌ها.',
  },
  {
    id: 'cap_supervision',
    text: 'مدیریت تفکیکی اتاق‌ها و کارتابل دسته‌بندی‌شده کارکنان: امتیاز دوگانه انضباط و نظافت، مرکز اقدام سریع (پیام، اخطار، فراخوانی، نمره منفی، معرفی به شورای انضباطی و گزارش به حراست)، دفتر وقایع، شیفت‌بندی، چاپ عمودی/افقی با تنظیم حاشیه و منوهای بازشونده منظم در کارتابل سرپرستی و سایر واحدها.',
  },
  {
    id: 'cap_community_voice',
    text: 'تالارهای گفتگو، چت خصوصی و تماس صوتی مستقیم: تالار گفتگوی عمومی، تالارهای تخصصی دانشجویی (با تأیید دوگانه مدیر و حراست و فیلتر رشته/ورودی/وضعیت اسکان)، چت خصوصی و گروه‌های داخلی کارکنان، ارسال پیام صوتی (ویس)، گفتگوی صوتی زنده، ویرایش و حذف پیام توسط کاربر، پاک‌سازی/حذف تالار توسط مدیر و کنترل سراسری و به تفکیک هر نوع کاربری بر تماس صوتی.',
  },
  {
    id: 'cap_security',
    text: 'واحد حراست و انتظامات: دسترسی جامع به گزارش‌های ثبت‌شده دانشجویان، امتیازات و اخطارها، پرونده کامل دانشجو، دریافت گزارش‌های تکی و چندنفره دانشجویی و همچنین گزارش‌های عمومی مربوط به سراها و محوطه بدون نیاز به انتخاب دانشجو، تأیید تالارهای تخصصی و مکاتبه دوطرفه با دانشجویان و کارکنان.',
  },
  {
    id: 'cap_notifications_popups',
    text: 'اطلاع‌رسانی هوشمند و مرکز اعلان‌ها: نمایش اطلاعیه‌های مهم در قالب دکمه بازشونده/پاپ‌آپ بدون شلوغی صفحه، اعلان‌های زنده با انیمیشن نرم و محو خودکار (Toast)، و زنگوله اعلان‌ها با باز شدن متن کامل اطلاعیه، تذکر یا پیام، خوانده‌شدن خودکار و دکمه بازگشت سریع.',
  },
  {
    id: 'cap_student_affairs',
    text: 'اداره امور دانشجویی و تربیت بدنی: پایش جامع دانشجویان خوابگاهی و ترددی با خروجی اکسل، برنامه‌ریزی و ثبت‌نام برنامه‌های متنوع ورزشی، مدیریت انتخابات شورای صنفی در بازه فعال و رسیدگی به پرونده‌های شورای انضباطی.',
  },
  {
    id: 'cap_cultural',
    text: 'واحد امور فرهنگی و فوق‌برنامه: جدول زمانی هفتگی برنامه‌های فرهنگی-تربیتی (به سبک برنامه کلاسی) قابل انتشار پس از تأیید در کارتابل دانشجو، راه‌اندازی تشکل‌ها و انجمن‌های دانشجویی با عضویت آزاد یا نیازمند تأیید و پاسخگویی پیام‌ها با حفظ حریم داده‌ها.',
  },
  {
    id: 'cap_education_counselor',
    text: 'کارشناس آموزش و مرکز مشاوره: پیام‌رسانی هدفمند آموزشی بر اساس نام، رشته، شماره دانشجویی، کد ملی و گروهی به رشته/ورودی، اعلام مرخصی تحصیلی/اخراج به مدیر، و مرکز مشاوره و صیانت محرمانه جهت نوبت‌دهی و حمایت روانی-تربیتی.',
  },
  {
    id: 'cap_surveys_announcements',
    text: 'نظرسنجی‌های دوره‌ای و اطلاعیه‌های غنی: ارزیابی کیفیت خدمات (سراها، سلف، تأسیسات و سرپرستان) با خروجی تحلیلی و اکسل، اطلاعیه‌های صفحه اول با ویرایشگر پیشرفته (ترازبندی، جدول، بولت، ایموجی، هایلایت و لایت‌باکس تصویر) و بازیابی دوعاملی رمز دانشجو.',
  },
  {
    id: 'cap_vice_dean',
    text: 'کارتابل جامع معاونت دانشجویی: تجمیع کامل اختیارات سرپرستی سراها، امور دانشجویی و تربیت بدنی و امور فرهنگی به همراه گزارش‌ساز تحلیلی چندبُعدی با ۹ فیلتر ترکیبی، خروجی اکسل چندکاربرگه و پایش یکپارچه مکاتبات تمامی حوزه‌ها.',
  },
  {
    id: 'cap_library_smart_clearance',
    text: 'کتابخانه و پژوهش، هوشمندسازی و تسویه الکترونیک فارغ‌التحصیلان: مدیریت مخزن کتب (تکی و اکسل) و امانت، اخطار و اطلاع‌رسانی واحد هوشمندسازی با رعایت حریم خصوصی، و گردش کار الکترونیک تسویه حساب فراغت از تحصیل با دروازه آموزش، تأیید ۱۲ واحد و چاپ تکی/یکجای A4 برای اداره فارغ‌التحصیلان.',
  },
  {
    id: 'cap_support_chain',
    highlight: true,
    text: 'زنجیره یکپارچه پشتیبانی و شفافیت ۱۶ نقشه: مدیریت تأسیسات و تعمیرات، انبارداری و حواله کالا، کارپردازی و خرید، امور مالی (۴۵٪ خوابگاهی / ۲۵٪ ترددی و بارگذاری اکسل بدهی)، نصب نسخه اپلیکیشن وب (PWA)، تقویم و ساعت زنده شمسی و ثبت لاگ کامل ممیزی فعالیت‌ها.',
  },
];

export const DEFAULT_BOARDING_SECTION_HTML =
  '<p>دانشگاه فرهنگیان به عنوان دانشگاه راهبردی، مادر و مأموریت‌محور کشور در نظام آموزش عالی و سند تحول بنیادین، عهده‌دار خطیرترین مسئولیت ملی یعنی <strong>جذب، آموزش، توانمندسازی و تربیت معلمان و مربیان آینده ایران اسلامی</strong> است.</p>' +
  '<p>یکی از ارکان هویتی و منحصر‌به‌فرد این دانشگاه، <strong>شبانه‌روزی بودن (Boarding Nature)</strong> آن است. در سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان، سراهای دانشجویی مهم‌ترین و اصلی‌ترین زیرمجموعه محسوب می‌شوند و در کنار امور آموزش، مالی، فرهنگی، ورزشی، مشاوره، حراست، کتابخانه و پژوهش، هوشمندسازی، تأسیسات و تسویه حساب فارغ‌التحصیلان، یک <strong>«زیست‌بوم یکپارچه تربیتی، علمی، رفاهی و مدیریتی»</strong> را برای پوشش کامل فعالیت‌های دانشجو در دانشگاه شکل می‌دهند.</p>' +
  '<p>این سامانه با معماری ماژولار ۱۶ نقشه، منوهای دسته‌بندی‌شده بازشونده، تالارهای گفتگو و پیام‌رسان صوتی-متنی با کنترل دسترسی دقیق مدیریتی، مرکز اعلان‌های هوشمند و قابلیت گزارش‌دهی ایمن دانشجویی و محیطی به حراست، پیوند هم‌زمان میان مدیریت ارشد، معاونت دانشجویی، سرپرستی سراها، حراست و انتظامات، امور دانشجویی و تربیت بدنی، امور فرهنگی، آموزش، کتابخانه و پژوهش، واحد هوشمندسازی، مرکز مشاوره، تأسیسات، انبار، کارپردازی، امور مالی، اداره فارغ‌التحصیلان و دانشجومعلمان را در بستری امن، سریع و قابل ردگیری برقرار می‌سازد.</p>';

export const DEFAULT_ABOUT_CONTENT: ResolvedAboutContent = {
  universityBadge: 'دانشگاه فرهنگیان استان اصفهان',
  headerTitle: 'سامانه جامع خدمات دانشجویی',
  headerSubtitle:
    'زیست‌بوم یکپارچه خدمات دانشجویی شامل سراها، آموزش، مالی، فرهنگی، ورزشی، کتابخانه، هوشمندسازی، مشاوره، حراست، تأسیسات، تالار گفتگو و پیام‌رسان صوتی و تسویه حساب فارغ‌التحصیلان',
  designerBadge: 'طراح، معمار سامانه و تحلیل‌گر ارشد:',
  designerName: 'دکتر محمد سپیانی',
  designerEmail: 'm.sepiani@cfu.ac.ir',
  designerBio:
    'طراحی و پیاده‌سازی‌شده بر پایه شناخت میدانی زیست‌بوم دانشگاه فرهنگیان، با هدف یکپارچه‌سازی کامل کلیه فعالیت‌های دانشجویی با محوریت سراهای دانشجویی، امور آموزش، مالی، تربیتی و فرهنگی، کتابخانه و پژوهش، هوشمندسازی، حراست، سلامت روان، ارتباطات امن متنی و صوتی، تسویه حساب الکترونیک فارغ‌التحصیلان و شفافیت مدیریتی در تمامی ۱۶ نقش تخصصی سامانه.',
  designerBioHtml:
    '<p>طراحی و پیاده‌سازی‌شده بر پایه شناخت میدانی زیست‌بوم دانشگاه فرهنگیان، با هدف یکپارچه‌سازی کامل کلیه فعالیت‌های دانشجویی با محوریت سراهای دانشجویی، امور آموزش، مالی، تربیتی و فرهنگی، کتابخانه و پژوهش، هوشمندسازی، حراست، سلامت روان، ارتباطات امن متنی و صوتی، تسویه حساب الکترونیک فارغ‌التحصیلان و شفافیت مدیریتی در تمامی ۱۶ نقش تخصصی سامانه.</p>',
  pdfCardTitle: 'دریافت سند جامع تحلیلی، فنی و راهنمای عملیاتی سامانه (فایل PDF)',
  pdfCardDescription:
    'مستند کامل و دسته‌بندی‌شده شامل فلسفه شبانه‌روزی و رسالت تربیت معلم، تشریح ماژول‌های عملیاتی، ماتریس ۱۶ نقش کاربری (از جمله سراها، تالار گفتگو و تماس صوتی، کتابخانه و پژوهش، هوشمندسازی و تسویه حساب الکترونیک فارغ‌التحصیلان)، سناریوهای تعاملی و معماری فنی سامانه',
  boardingSectionTitle: 'ماهیت شبانه‌روزی دانشگاه فرهنگیان و رسالت بنیادین تربیت معلم',
  boardingSectionHtml: DEFAULT_BOARDING_SECTION_HTML,
  boardingSectionText:
    'دانشگاه فرهنگیان به عنوان دانشگاه راهبردی، مادر و مأموریت‌محور کشور در نظام آموزش عالی و سند تحول بنیادین، عهده‌دار خطیرترین مسئولیت ملی یعنی جذب، آموزش، توانمندسازی و تربیت معلمان و مربیان آینده ایران اسلامی است. در سامانه جامع خدمات دانشجویی، سراهای دانشجویی به عنوان اصلی‌ترین زیرمجموعه در کنار آموزش، مالی، فرهنگی، ورزشی، کتابخانه و پژوهش، هوشمندسازی، مشاوره، حراست و تالارهای گفتگو تمامی فعالیت‌های دانشجو را پوشش می‌دهند.',
  capabilitiesSectionTitle: 'اهداف، ساختار و منظومه قابلیت‌های یکپارچه سامانه (۱۶ نقش تخصصی)',
  capabilities: DEFAULT_ABOUT_CAPABILITIES,
  extraSectionTitle: 'مستندات، آیین‌نامه‌ها و فایل‌های تکمیلی',
  extraSectionHtml: '',
  extraSectionText: '',
  attachmentsTitle: 'فایل‌ها، بخشنامه‌ها و مستندات پیوست‌شده توسط مدیریت',
  attachments: [],
  footerNote:
    'نسخه جامع ۱۶ نقشه سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان',
};

export function resolveAboutContent(custom?: AboutContentSettings): ResolvedAboutContent {
  if (!custom) return DEFAULT_ABOUT_CONTENT;
  return {
    universityBadge: custom.universityBadge?.trim() || DEFAULT_ABOUT_CONTENT.universityBadge,
    headerTitle: custom.headerTitle?.trim() || DEFAULT_ABOUT_CONTENT.headerTitle,
    headerSubtitle: custom.headerSubtitle?.trim() || DEFAULT_ABOUT_CONTENT.headerSubtitle,
    designerBadge: custom.designerBadge?.trim() || DEFAULT_ABOUT_CONTENT.designerBadge,
    designerName: custom.designerName?.trim() || DEFAULT_ABOUT_CONTENT.designerName,
    designerEmail: custom.designerEmail?.trim() || DEFAULT_ABOUT_CONTENT.designerEmail,
    designerBio: custom.designerBio?.trim() || DEFAULT_ABOUT_CONTENT.designerBio,
    designerBioHtml:
      custom.designerBioHtml?.trim() ||
      (custom.designerBio?.trim()
        ? `<p>${custom.designerBio.trim()}</p>`
        : DEFAULT_ABOUT_CONTENT.designerBioHtml),
    pdfCardTitle: custom.pdfCardTitle?.trim() || DEFAULT_ABOUT_CONTENT.pdfCardTitle,
    pdfCardDescription:
      custom.pdfCardDescription?.trim() || DEFAULT_ABOUT_CONTENT.pdfCardDescription,
    boardingSectionTitle:
      custom.boardingSectionTitle?.trim() || DEFAULT_ABOUT_CONTENT.boardingSectionTitle,
    boardingSectionHtml:
      custom.boardingSectionHtml?.trim() || DEFAULT_ABOUT_CONTENT.boardingSectionHtml,
    boardingSectionText:
      custom.boardingSectionText?.trim() || DEFAULT_ABOUT_CONTENT.boardingSectionText,
    capabilitiesSectionTitle:
      custom.capabilitiesSectionTitle?.trim() || DEFAULT_ABOUT_CONTENT.capabilitiesSectionTitle,
    capabilities:
      Array.isArray(custom.capabilities) && custom.capabilities.length > 0
        ? custom.capabilities
        : DEFAULT_ABOUT_CONTENT.capabilities,
    extraSectionTitle: custom.extraSectionTitle?.trim() || DEFAULT_ABOUT_CONTENT.extraSectionTitle,
    extraSectionHtml: custom.extraSectionHtml || '',
    extraSectionText: custom.extraSectionText || '',
    attachmentsTitle: custom.attachmentsTitle?.trim() || DEFAULT_ABOUT_CONTENT.attachmentsTitle,
    attachments: Array.isArray(custom.attachments) ? custom.attachments : [],
    footerNote: custom.footerNote?.trim() || DEFAULT_ABOUT_CONTENT.footerNote,
    updatedAt: custom.updatedAt,
  };
}
