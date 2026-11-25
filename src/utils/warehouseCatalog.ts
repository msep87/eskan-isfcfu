export type WarehouseCatalogCategory =
  | 'office'
  | 'cleaning'
  | 'electrical'
  | 'plumbing'
  | 'carpentry'
  | 'it_general';

export interface PresetWarehouseCatalogItem {
  id: string;
  name: string;
  category: WarehouseCatalogCategory;
  defaultUnit: string;
}

export const WAREHOUSE_CATALOG_CATEGORY_LABELS: Record<WarehouseCatalogCategory, string> = {
  office: 'اداری و نوشت‌افزار',
  cleaning: 'نظافتی و بهداشتی',
  electrical: 'برق و روشنایی',
  plumbing: 'شیرآلات و لوله‌کشی',
  carpentry: 'قفل، نجاری و تجهیزات اتاق',
  it_general: 'رایانه‌ای، پذیرایی و عمومی',
};

/**
 * فهرست پیش‌فرض و ثابت اقلام انبار جهت انتخاب توسط کارکنان و سرپرستان
 * (کاملاً مستقل از موجودی واقعی انبار؛ هیچ اطلاعاتی از موجودی یا قیمت نمایش داده نمی‌شود)
 */
export const DEFAULT_WAREHOUSE_CATALOG: PresetWarehouseCatalogItem[] = [
  // اداری و نوشت‌افزار
  { id: 'cat_off_a4', name: 'کاغذ A4 (بسته ۵۰۰ برگی)', category: 'office', defaultUnit: 'بسته' },
  { id: 'cat_off_a3', name: 'کاغذ A3', category: 'office', defaultUnit: 'بسته' },
  { id: 'cat_off_toner', name: 'تونر / شارژ کارتریج پرینتر', category: 'office', defaultUnit: 'عدد' },
  { id: 'cat_off_pen', name: 'خودکار (آبی / مشکی / قرمز)', category: 'office', defaultUnit: 'عدد' },
  { id: 'cat_off_marker', name: 'ماژیک وایت‌برد', category: 'office', defaultUnit: 'عدد' },
  { id: 'cat_off_highlighter', name: 'ماژیک علامت‌گذار (هایلایتر)', category: 'office', defaultUnit: 'عدد' },
  { id: 'cat_off_binder', name: 'زونکن اداری', category: 'office', defaultUnit: 'عدد' },
  { id: 'cat_off_folder', name: 'پوشه و گیره کاغذ', category: 'office', defaultUnit: 'بسته' },
  { id: 'cat_off_stapler', name: 'منگنه و سوزن منگنه', category: 'office', defaultUnit: 'بسته' },
  { id: 'cat_off_notebook', name: 'دفتر یادداشت / دفتر ثبت وقایع', category: 'office', defaultUnit: 'جلد' },
  { id: 'cat_off_envelope', name: 'پاکت نامه و پاکت پرونده', category: 'office', defaultUnit: 'بسته' },
  { id: 'cat_off_tape', name: 'چسب نواری پهن و شیشه‌ای', category: 'office', defaultUnit: 'حلقه' },
  { id: 'cat_off_whiteboard', name: 'تخته پاک‌کن و اسپری وایت‌برد', category: 'office', defaultUnit: 'عدد' },

  // نظافتی و بهداشتی
  { id: 'cat_cln_soap', name: 'مایع دستشویی', category: 'cleaning', defaultUnit: 'لیتر' },
  { id: 'cat_cln_dish', name: 'مایع ظرفشویی', category: 'cleaning', defaultUnit: 'لیتر' },
  { id: 'cat_cln_bleach', name: 'مایع سفیدکننده و جرم‌گیر', category: 'cleaning', defaultUnit: 'لیتر' },
  { id: 'cat_cln_glass', name: 'شیشه‌پاک‌کن', category: 'cleaning', defaultUnit: 'عدد' },
  { id: 'cat_cln_tissue', name: 'دستمال کاغذی (جعبه‌ای / حوله‌ای)', category: 'cleaning', defaultUnit: 'بسته' },
  { id: 'cat_cln_trashbag', name: 'کیسه زباله ضخیم', category: 'cleaning', defaultUnit: 'رول' },
  { id: 'cat_cln_mop', name: 'تی نخی / زمین‌شوی', category: 'cleaning', defaultUnit: 'عدد' },
  { id: 'cat_cln_broom', name: 'جارو و خاک‌انداز', category: 'cleaning', defaultUnit: 'ست' },
  { id: 'cat_cln_glove', name: 'دستکش نظافت', category: 'cleaning', defaultUnit: 'جفت' },
  { id: 'cat_cln_disinfect', name: 'محلول ضدعفونی‌کننده سطوح', category: 'cleaning', defaultUnit: 'لیتر' },

  // برق و روشنایی
  { id: 'cat_elc_led', name: 'لامپ LED کم‌مصرف', category: 'electrical', defaultUnit: 'عدد' },
  { id: 'cat_elc_tube', name: 'لامپ مهتابی / پنل سقفی LED', category: 'electrical', defaultUnit: 'عدد' },
  { id: 'cat_elc_switch', name: 'کلید و پریز برق', category: 'electrical', defaultUnit: 'عدد' },
  { id: 'cat_elc_strip', name: 'چندراهی برق (سه/شش خانه)', category: 'electrical', defaultUnit: 'عدد' },
  { id: 'cat_elc_protector', name: 'محافظ ولتاژ برق', category: 'electrical', defaultUnit: 'عدد' },
  { id: 'cat_elc_battery', name: 'باتری قلمی / نیم‌قلمی', category: 'electrical', defaultUnit: 'بسته' },
  { id: 'cat_elc_wire', name: 'سیم و کابل برق', category: 'electrical', defaultUnit: 'متر' },
  { id: 'cat_elc_fuse', name: 'کلید مینیاتوری / فیوز برق', category: 'electrical', defaultUnit: 'عدد' },

  // شیرآلات و لوله‌کشی
  { id: 'cat_plm_faucet', name: 'شیر آب اهرمی / روشویی', category: 'plumbing', defaultUnit: 'عدد' },
  { id: 'cat_plm_hose', name: 'شلنگ پیسوار / شلنگ توالت', category: 'plumbing', defaultUnit: 'عدد' },
  { id: 'cat_plm_shower', name: 'سردوش و شلنگ حمام', category: 'plumbing', defaultUnit: 'ست' },
  { id: 'cat_plm_siphon', name: 'سیفون زیر روشویی / ظرفشویی', category: 'plumbing', defaultUnit: 'عدد' },
  { id: 'cat_plm_teflon', name: 'نوار تفلون و واشر آب‌بندی', category: 'plumbing', defaultUnit: 'بسته' },
  { id: 'cat_plm_flush', name: 'قطعات فلاش‌تانک و شناور', category: 'plumbing', defaultUnit: 'ست' },

  // قفل، نجاری و تجهیزات اتاق
  { id: 'cat_crp_lock', name: 'قفل و مغزی در اتاق (همراه با کلید)', category: 'carpentry', defaultUnit: 'عدد' },
  { id: 'cat_crp_handle', name: 'دستگیره در', category: 'carpentry', defaultUnit: 'جفت' },
  { id: 'cat_crp_hinge', name: 'لولا و یراق‌آلات کمد و در', category: 'carpentry', defaultUnit: 'عدد' },
  { id: 'cat_crp_padlock', name: 'قفل کتابی / آویز', category: 'carpentry', defaultUnit: 'عدد' },
  { id: 'cat_crp_mattress', name: 'تشک و روتختی خوابگاهی', category: 'carpentry', defaultUnit: 'عدد' },
  { id: 'cat_crp_pillow', name: 'بالش و روبالشی', category: 'carpentry', defaultUnit: 'عدد' },
  { id: 'cat_crp_chair', name: 'صندلی اداری / مطالعه', category: 'carpentry', defaultUnit: 'عدد' },
  { id: 'cat_crp_curtain', name: 'پرده و چوب‌پرده', category: 'carpentry', defaultUnit: 'عدد' },

  // رایانه‌ای، پذیرایی و عمومی
  { id: 'cat_it_mouse_kb', name: 'ماوس و صفحه‌کلید (کیبورد)', category: 'it_general', defaultUnit: 'ست' },
  { id: 'cat_it_lan', name: 'کابل شبکه (LAN) و سوکت', category: 'it_general', defaultUnit: 'عدد' },
  { id: 'cat_it_hdmi', name: 'کابل HDMI / تبدیل تصویر', category: 'it_general', defaultUnit: 'عدد' },
  { id: 'cat_it_flash', name: 'حافظه فلش (USB)', category: 'it_general', defaultUnit: 'عدد' },
  { id: 'cat_gen_tea', name: 'چای، قند و اقلام پذیرایی جلسات', category: 'it_general', defaultUnit: 'بسته' },
  { id: 'cat_gen_cup', name: 'لیوان یکبارمصرف (کاغذی / گیاهی)', category: 'it_general', defaultUnit: 'بسته' },
  { id: 'cat_gen_firstaid', name: 'اقلام جعبه کمک‌های اولیه', category: 'it_general', defaultUnit: 'بسته' },
  { id: 'cat_gen_extinguisher', name: 'شارژ یا کپسول آتش‌نشانی', category: 'it_general', defaultUnit: 'عدد' },
];

export const WAREHOUSE_REQUESTER_ROLE_LABELS: Record<string, string> = {
  admin: 'مدیریت کل سامانه',
  supervisor: 'سرپرستی سراهای دانشجویی',
  maintenance: 'واحد تأسیسات و فنی',
  warehouse: 'واحد انبار و تجهیزات',
  procurement: 'واحد کارپردازی و خرید',
  counselor: 'مرکز مشاوره و سلامت روان',
  finance: 'واحد امور مالی و حسابداری',
  education: 'واحد امور آموزشی',
  cultural: 'واحد امور فرهنگی',
  student_affairs: 'امور دانشجویی و تربیت بدنی',
  security: 'واحد حراست و انتظامات',
  vice_dean: 'معاونت دانشجویی',
  library: 'واحد کتابخانه و پژوهش',
  smart_campus: 'واحد هوشمندسازی و فناوری',
  graduation: 'واحد فارغ‌التحصیلان',
  academic_deputy: 'معاونت آموزشی',
};
