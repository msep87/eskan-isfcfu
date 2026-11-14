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
      lowerVal.includes('expression(') ||
      lowerVal.includes('url(')
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
    tagName === 'SVG' ||
    tagName === 'MATH' ||
    tagName === 'FORM'
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

  const cleanEl = doc.createElement(tagName.toLowerCase());

  const styleAttr = el.getAttribute('style');
  if (styleAttr) {
    const safeStyle = filterInlineStyle(styleAttr);
    if (safeStyle) cleanEl.setAttribute('style', safeStyle);
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
  return (parsed.body.textContent || '').replace(/\u200B/g, '').trim();
}

export function plainTextToHtml(text: string): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\r?\n/g, '<br />');
}
