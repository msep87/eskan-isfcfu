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
    text: 'سامانه هوشمند اسکان، انتخاب گرافیکی اتاق و تخت (طبقه بالا/پایین)، کارت دانشجومعلمی هوشمند CR-80 با کیوآرکد، درخواست جابجایی، مهمان و انصراف از سرا با حفظ کامل حریم خصوصی.',
  },
  {
    id: 'cap_supervision',
    text: 'مدیریت تفکیکی اتاق‌ها توسط مدیر و سرپرستان با امتیاز دوگانه انضباط و نظافت، مرکز اقدام سریع (پیام، اخطار، فراخوانی، نمره منفی، معرفی به شورای انضباطی و گزارش به حراست)، دفتر وقایع، شیفت‌بندی و چاپ عمودی/افقی با تنظیم حاشیه.',
  },
  {
    id: 'cap_security',
    text: 'واحد حراست و انتظامات: دسترسی جامع به گزارش‌های ثبت‌شده دانشجویان، امتیازات و اخطارها، پرونده کامل دانشجو، دریافت گزارش‌های چندنفره از سرپرست، مدیر، تأسیسات و امور دانشجویی و پیام‌رسانی مستقیم با دانشجویان و سایر کارکنان.',
  },
  {
    id: 'cap_student_affairs',
    text: 'اداره امور دانشجویی و تربیت بدنی: پایش جامع دانشجویان خوابگاهی و ترددی با خروجی اکسل، برنامه‌ریزی و ثبت‌نام برنامه‌های متنوع ورزشی، مدیریت انتخابات شورای صنفی در بازه فعال و رسیدگی به پرونده‌های شورای انضباطی.',
  },
  {
    id: 'cap_cultural',
    text: 'واحد امور فرهنگی و فوق‌برنامه: جدول زمانی هفتگی برنامه‌های فرهنگی-تربیتی (به سبک برنامه کلاسی) قابل انتشار پس از تأیید در کارتابل دانشجو، راه‌اندازی تشکل‌ها و انجمن‌های دانشجویی با عضویت/تأیید و پاسخگویی پیام‌ها با حفظ حریم داده‌ها.',
  },
  {
    id: 'cap_education_counselor',
    text: 'کارشناس آموزش (پیام‌رسانی هدفمند بر اساس نام، رشته، شماره دانشجویی، کد ملی و گروهی به رشته/ورودی و اعلام مرخصی/اخراج به مدیر) به همراه مرکز مشاوره و صیانت محرمانه جهت حمایت روانی-تربیتی.',
  },
  {
    id: 'cap_surveys_announcements',
    text: 'نظرسنجی‌های دوره‌ای کیفیت خدمات (سراها، سلف، تأسیسات و عملکرد سرپرستان) با خروجی تحلیلی و اکسل، اطلاعیه‌های غنی صفحه اول با ویرایشگر پیشرفته (ترازبندی، جدول، بولت، ایموجی، هایلایت و تصویر با لایت‌باکس) و بازیابی دوعاملی رمز دانشجو.',
  },
  {
    id: 'cap_vice_dean',
    text: 'کارتابل جامع معاونت دانشجویی (نقش سیزدهم): تجمیع کامل اختیارات سرپرستی سراها، امور دانشجویی و تربیت بدنی و امور فرهنگی به همراه گزارش‌ساز تحلیلی چندبُعدی با فیلترهای متنوع و پایش یکپارچه مکاتبات تمامی حوزه‌ها (با امکان پیام مستقیم با کلیه کارکنان بجز دانشجو).',
  },
  {
    id: 'cap_support_chain',
    highlight: true,
    text: 'زنجیره یکپارچه پشتیبانی و شفافیت: مدیریت تأسیسات و تعمیرات، انبارداری و حواله کالا، کارپردازی خرید، امور مالی (۴۵٪ خوابگاهی / ۲۵٪ ترددی و اکسل بدهی)، احراز هویت سه‌دسته هوشمند و ثبت لاگ کامل فعالیت‌های ۱۳ نقش تخصصی سامانه.',
  },
];

export const DEFAULT_BOARDING_SECTION_HTML =
  '<p>دانشگاه فرهنگیان به عنوان دانشگاه راهبردی، مادر و مأموریت‌محور کشور در نظام آموزش عالی و سند تحول بنیادین، عهده‌دار خطیرترین مسئولیت ملی یعنی <strong>جذب، آموزش، توانمندسازی و تربیت معلمان و مربیان آینده ایران اسلامی</strong> است.</p>' +
  '<p>یکی از ارکان هویتی و منحصر‌به‌فرد این دانشگاه، <strong>شبانه‌روزی بودن (Boarding Nature)</strong> آن است. در دانشگاه فرهنگیان، سراهای دانشجویی صرفاً خوابگاه یا محل استراحت شبانه نیستند؛ بلکه امتداد طبیعی کلاس تربیت و یک <strong>«زیست‌بوم یکپارچه تربیتی، فرهنگی، اخلاقی، ورزشی، امن و مهارتی»</strong> محسوب می‌شوند که در آن منش معلمی، قانون‌مداری، همزیستی مسئولانه، مشارکت صنفی و نشاط علمی و روانشناختی دانشجومعلمان شکل می‌گیرد.</p>' +
  '<p>این سامانه با طراحی ماژولار ۱۳ نقشه، پیوند هم‌زمان میان مدیریت ارشد، معاونت دانشجویی، سرپرستی سراها، حراست و انتظامات، امور دانشجویی و تربیت بدنی، امور فرهنگی، آموزش، مرکز مشاوره، تأسیسات، انبار، کارپردازی، امور مالی و دانشجومعلمان را در بستری امن، سریع و قابل ردگیری برقرار می‌سازد.</p>';

export const DEFAULT_ABOUT_CONTENT: ResolvedAboutContent = {
  universityBadge: 'دانشگاه فرهنگیان استان اصفهان',
  headerTitle: 'سامانه جامع سراهای دانشجویی',
  headerSubtitle:
    'زیست‌بوم هوشمند اسکان، تربیت معلم، معاونت دانشجویی، حراست، ورزش، فرهنگی، مشاوره، آموزش، مالی و تأسیسات',
  designerBadge: 'طراح، معمار سامانه و تحلیل‌گر ارشد:',
  designerName: 'دکتر محمد سپیانی',
  designerEmail: 'm.sepiani@cfu.ac.ir',
  designerBio:
    'طراحی و پیاده‌سازی‌شده بر پایه شناخت میدانی زیست‌بوم شبانه‌روزی دانشگاه فرهنگیان، با هدف یکپارچه‌سازی کامل فرآیندهای اسکان، امور تربیتی و فرهنگی، حراست و انتظامات، ورزش و رفاه دانشجویی، سلامت روان، پشتیبانی فنی-مالی و شفافیت مدیریتی در تمامی ۱۳ نقش تخصصی سامانه.',
  designerBioHtml:
    '<p>طراحی و پیاده‌سازی‌شده بر پایه شناخت میدانی زیست‌بوم شبانه‌روزی دانشگاه فرهنگیان، با هدف یکپارچه‌سازی کامل فرآیندهای اسکان، امور تربیتی و فرهنگی، حراست و انتظامات، ورزش و رفاه دانشجویی، سلامت روان، پشتیبانی فنی-مالی و شفافیت مدیریتی در تمامی ۱۳ نقش تخصصی سامانه.</p>',
  pdfCardTitle: 'دریافت سند جامع تحلیلی، فنی و راهنمای عملیاتی سامانه (فایل PDF)',
  pdfCardDescription:
    'مستند کامل و دسته‌بندی‌شده شامل فلسفه شبانه‌روزی و رسالت تربیت معلم، تشریح ماژول‌های عملیاتی، ماتریس ۱۳ نقش کاربری (از جمله معاونت دانشجویی و واحد حراست و انتظامات)، سناریوهای تعاملی و معماری فنی سامانه',
  boardingSectionTitle: 'ماهیت شبانه‌روزی دانشگاه فرهنگیان و رسالت بنیادین تربیت معلم',
  boardingSectionHtml: DEFAULT_BOARDING_SECTION_HTML,
  boardingSectionText:
    'دانشگاه فرهنگیان به عنوان دانشگاه راهبردی، مادر و مأموریت‌محور کشور در نظام آموزش عالی و سند تحول بنیادین، عهده‌دار خطیرترین مسئولیت ملی یعنی جذب، آموزش، توانمندسازی و تربیت معلمان و مربیان آینده ایران اسلامی است. یکی از ارکان هویتی و منحصر‌به‌فرد این دانشگاه، شبانه‌روزی بودن (Boarding Nature) آن است؛ سراهای دانشجویی امتداد طبیعی کلاس تربیت و زیست‌بوم یکپارچه تربیتی، فرهنگی، اخلاقی، ورزشی، امن و مهارتی محسوب می‌شوند.',
  capabilitiesSectionTitle: 'اهداف، ساختار و منظومه قابلیت‌های یکپارچه سامانه (۱۳ نقش تخصصی)',
  capabilities: DEFAULT_ABOUT_CAPABILITIES,
  extraSectionTitle: 'مستندات، آیین‌نامه‌ها و فایل‌های تکمیلی',
  extraSectionHtml: '',
  extraSectionText: '',
  attachmentsTitle: 'فایل‌ها، بخشنامه‌ها و مستندات پیوست‌شده توسط مدیریت',
  attachments: [],
  footerNote:
    'سال تحصیلی فعال: ۱۴۰۵-۱۴۰۶ • نسخه جامع ۱۳ نقشه مدیریت هوشمند سراهای دانشگاه فرهنگیان',
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
