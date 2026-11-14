import { CustomFont } from '../types';

export interface FontOption {
  id: string;
  name: string;
  cssFamily: string;
  isCustom: boolean;
  format?: string;
}

export const STANDARD_FONTS: FontOption[] = [
  {
    id: 'vazir',
    name: 'وزیرمتن (استاندارد وب و رسمی)',
    cssFamily: "'Vazirmatn', sans-serif",
    isCustom: false,
  },
  {
    id: 'shabnam',
    name: 'شبنم (خوانا و نرم)',
    cssFamily: "'Shabnam', 'Vazirmatn', sans-serif",
    isCustom: false,
  },
  {
    id: 'sahel',
    name: 'ساحل (کلاسیک و متین)',
    cssFamily: "'Sahel', 'Vazirmatn', sans-serif",
    isCustom: false,
  },
  {
    id: 'ibm-plex',
    name: 'آی‌بی‌ام پلکس (مدرن و اداری)',
    cssFamily: "'IBM Plex Sans Arabic', 'Vazirmatn', sans-serif",
    isCustom: false,
  },
  {
    id: 'noto-naskh',
    name: 'نوتو نسخ (رسمی و بخشنامه‌ای)',
    cssFamily: "'Noto Naskh Arabic', 'Vazirmatn', sans-serif",
    isCustom: false,
  },
  {
    id: 'lalezar',
    name: 'لاله‌زار (تیتر و نمایشی)',
    cssFamily: "'Lalezar', 'Vazirmatn', sans-serif",
    isCustom: false,
  },
  {
    id: 'system',
    name: 'فونت پیش‌فرض سیستم',
    cssFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, sans-serif",
    isCustom: false,
  },
];

export function getAvailableFontOptions(customFonts?: CustomFont[]): FontOption[] {
  const customOptions: FontOption[] = (customFonts || []).map((cf) => ({
    id: cf.fontFamily,
    name: cf.name,
    cssFamily: `'${cf.fontFamily}', 'Vazirmatn', sans-serif`,
    isCustom: true,
    format: cf.format,
  }));

  return [...STANDARD_FONTS, ...customOptions];
}

export function resolveFontCssFamily(
  fontFamilyKey: string | undefined,
  customFonts?: CustomFont[]
): string {
  const key = fontFamilyKey || 'vazir';
  const custom = (customFonts || []).find(
    (cf) => cf.fontFamily === key || cf.id === key
  );
  if (custom) {
    return `'${custom.fontFamily}', 'Vazirmatn', sans-serif`;
  }
  const std = STANDARD_FONTS.find((f) => f.id === key);
  return std ? std.cssFamily : "'Vazirmatn', sans-serif";
}

export async function readMultipleFontFiles(
  fileList: FileList | File[],
  singleCustomDisplayName?: string
): Promise<{ added: CustomFont[]; errors: string[] }> {
  const files = Array.from(fileList);
  const added: CustomFont[] = [];
  const errors: string[] = [];

  const now = Date.now();

  await Promise.all(
    files.map(
      (file, index) =>
        new Promise<void>((resolve) => {
          if (file.size > 8 * 1024 * 1024) {
            errors.push(`فایل «${file.name}» بیشتر از ۸ مگابایت است و بارگذاری نشد.`);
            resolve();
            return;
          }

          const dotIdx = file.name.lastIndexOf('.');
          const ext = dotIdx !== -1 ? file.name.substring(dotIdx + 1).toLowerCase() : '';
          if (!['ttf', 'woff', 'woff2', 'otf'].includes(ext)) {
            errors.push(`فرمت فایل «${file.name}» مجاز نیست (فقط TTF, WOFF, WOFF2, OTF).`);
            resolve();
            return;
          }

          let format = 'truetype';
          if (ext === 'woff') format = 'woff';
          else if (ext === 'woff2') format = 'woff2';
          else if (ext === 'otf') format = 'opentype';

          const baseName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;
          const displayName =
            files.length === 1 && singleCustomDisplayName?.trim()
              ? singleCustomDisplayName.trim()
              : baseName || `فونت سفارشی ${index + 1}`;

          const uniqueSuffix = `${now}_${index}_${Math.random().toString(36).slice(2, 6)}`;
          const fontId = `custom_font_${uniqueSuffix}`;
          const fontCssFamily = `CF_${uniqueSuffix}`;

          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) {
              errors.push(`خطا در خواندن فایل «${file.name}».`);
              resolve();
              return;
            }
            added.push({
              id: fontId,
              name: displayName,
              fontFamily: fontCssFamily,
              dataUrl,
              format,
            });
            resolve();
          };
          reader.onerror = () => {
            errors.push(`خطا در خواندن فایل «${file.name}».`);
            resolve();
          };
          reader.readAsDataURL(file);
        })
    )
  );

  return { added, errors };
}
