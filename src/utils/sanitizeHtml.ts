const ALLOWED_TAGS = new Set([
  'SPAN',
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'STRIKE',
  'P',
  'DIV',
  'BR',
  'UL',
  'OL',
  'LI',
  'FONT',
  'BLOCKQUOTE',
  'H1',
  'H2',
  'H3',
  'H4',
  'TABLE',
  'THEAD',
  'TBODY',
  'TFOOT',
  'TR',
  'TH',
  'TD',
  'CAPTION',
  'IMG',
  'MARK',
]);

const ALLOWED_STYLE_PROPS = new Set([
  'font-family',
  'font-size',
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-align',
  'list-style-type',
  'list-style-position',
  'border',
  'border-collapse',
  'border-radius',
  'width',
  'min-width',
  'max-width',
  'height',
  'max-height',
  'padding',
  'padding-right',
  'padding-left',
  'margin',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'vertical-align',
  'display',
  'object-fit',
  'cursor',
]);

function filterInlineStyle(styleValue: string): string {
  if (!styleValue) return '';
  const parts = styleValue.split(';');
  const safeParts: string[] = [];

  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = part.slice(0, colonIdx).trim().toLowerCase();
    const val = part.slice(colonIdx + 1).trim();
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
    const lowerVal = val.toLowerCase();
    if (
      !val ||
      lowerVal.includes('javascript:') ||
      lowerVal.includes('vbscript:') ||
      lowerVal.includes('data:') ||
      lowerVal.includes('expression(') ||
      lowerVal.includes('url(') ||
      lowerVal.includes('behavior:') ||
      lowerVal.includes('-moz-binding') ||
      lowerVal.includes('@import') ||
      lowerVal.includes('\\')
    ) {
      continue;
    }
    safeParts.push(`${prop}: ${val}`);
  }

  return safeParts.join('; ');
}

function sanitizeNode(node: Node, doc: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as Element;
  const tagName = el.tagName.toUpperCase();

  if (
    tagName === 'SCRIPT' ||
    tagName === 'STYLE' ||
    tagName === 'IFRAME' ||
    tagName === 'OBJECT' ||
    tagName === 'EMBED' ||
    tagName === 'APPLET' ||
    tagName === 'SVG' ||
    tagName === 'MATH' ||
    tagName === 'FORM' ||
    tagName === 'INPUT' ||
    tagName === 'BUTTON' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    tagName === 'BASE' ||
    tagName === 'META' ||
    tagName === 'LINK' ||
    tagName === 'TEMPLATE' ||
    tagName === 'NOSCRIPT'
  ) {
    return null;
  }

  if (!ALLOWED_TAGS.has(tagName)) {
    const frag = doc.createDocumentFragment();
    Array.from(el.childNodes).forEach((child) => {
      const cleanChild = sanitizeNode(child, doc);
      if (cleanChild) frag.appendChild(cleanChild);
    });
    return frag;
  }

  if (tagName === 'IMG') {
    const src = el.getAttribute('src');
    if (!isSafeMediaUrl(src)) {
      return null;
    }
    const cleanImg = doc.createElement('img');
    cleanImg.setAttribute('src', src!.trim());
    const alt = el.getAttribute('alt');
    if (alt) cleanImg.setAttribute('alt', alt.slice(0, 200));
    const styleAttr = el.getAttribute('style');
    if (styleAttr) {
      const safeStyle = filterInlineStyle(styleAttr);
      if (safeStyle) cleanImg.setAttribute('style', safeStyle);
    }
    return cleanImg;
  }

  const cleanEl = doc.createElement(tagName.toLowerCase());

  const styleAttr = el.getAttribute('style');
  let safeStyle = styleAttr ? filterInlineStyle(styleAttr) : '';

  const alignAttr = el.getAttribute('align')?.trim().toLowerCase();
  if (alignAttr && (alignAttr === 'left' || alignAttr === 'center' || alignAttr === 'right' || alignAttr === 'justify')) {
    if (!/text-align\s*:/i.test(safeStyle)) {
      safeStyle = safeStyle ? `${safeStyle}; text-align: ${alignAttr}` : `text-align: ${alignAttr}`;
    }
  }

  if (safeStyle) {
    cleanEl.setAttribute('style', safeStyle);
  }

  if (tagName === 'FONT') {
    const colorAttr = el.getAttribute('color');
    const faceAttr = el.getAttribute('face');
    if (colorAttr && /^#[0-9a-fA-F]{3,8}$|^[a-zA-Z]+$|^rgb/.test(colorAttr.trim())) {
      cleanEl.setAttribute('color', colorAttr.trim());
    }
    if (faceAttr && !/[<>;"']/.test(faceAttr)) {
      cleanEl.setAttribute('face', faceAttr.trim());
    }
  }

  if (tagName === 'OL' || tagName === 'UL') {
    const listType = el.getAttribute('type')?.trim();
    if (listType && /^(1|a|A|i|I|disc|circle|square)$/.test(listType)) {
      cleanEl.setAttribute('type', listType);
    }
  }

  if (tagName === 'TH' || tagName === 'TD') {
    const colspan = el.getAttribute('colspan')?.trim();
    const rowspan = el.getAttribute('rowspan')?.trim();
    if (colspan && /^\d{1,2}$/.test(colspan)) cleanEl.setAttribute('colspan', colspan);
    if (rowspan && /^\d{1,2}$/.test(rowspan)) cleanEl.setAttribute('rowspan', rowspan);
  }

  const dirAttr = el.getAttribute('dir');
  if (dirAttr === 'rtl' || dirAttr === 'ltr' || dirAttr === 'auto') {
    cleanEl.setAttribute('dir', dirAttr);
  }

  Array.from(el.childNodes).forEach((child) => {
    const cleanChild = sanitizeNode(child, doc);
    if (cleanChild) cleanEl.appendChild(cleanChild);
  });

  return cleanEl;
}

export function sanitizeRichHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');
  const outDoc = document.implementation.createHTMLDocument('');
  const container = outDoc.createElement('div');

  Array.from(parsed.body.childNodes).forEach((child) => {
    const cleanChild = sanitizeNode(child, outDoc);
    if (cleanChild) container.appendChild(cleanChild);
  });

  return container.innerHTML;
}

export function extractPlainText(html: string): string {
  if (!html || typeof html !== 'string') return '';
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');
  const text = (parsed.body.textContent || '').replace(/\u200B/g, '').trim();
  if (text) return text;
  if (parsed.body.querySelector('img')) return 'تصویر پیوست متن';
  if (parsed.body.querySelector('table')) return 'جدول اطلاعات';
  return '';
}

export function plainTextToHtml(text: string): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\r?\n/g, '<br />');
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isSafeMediaUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // فقط تصاویر پیکسلی امن مجاز هستند و data:image/svg+xml جهت جلوگیری از XSS مسدود می‌شود
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(trimmed)) return true;
  if (trimmed.toLowerCase().startsWith('data:')) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return true;
  try {
    const parsed = new URL(trimmed, 'https://example.invalid');
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
