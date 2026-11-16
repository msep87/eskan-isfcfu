import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  List,
  ListX,
  Eraser,
  Type,
  Palette,
  Highlighter,
  Smile,
  Table as TableIcon,
  ImagePlus,
  Upload,
  ChevronDown,
  X,
} from 'lucide-react';
import { CustomFont } from '../types';
import { getAvailableFontOptions } from '../utils/fonts';
import { sanitizeRichHtml, extractPlainText, isSafeMediaUrl } from '../utils/sanitizeHtml';
import { ImageLightboxModal } from './ImageLightboxModal';

interface RichTextEditorProps {
  valueHtml: string;
  onChange: (html: string, plainText: string) => void;
  customFonts?: CustomFont[];
  placeholder?: string;
  minHeightClass?: string;
  resetKey?: string | number;
}

const FONT_SIZES = [
  { label: '۱۱ (خیلی ریز)', value: '11px' },
  { label: '۱۲ (کوچک)', value: '12px' },
  { label: '۱۴ (استاندارد)', value: '14px' },
  { label: '۱۶ (متوسط)', value: '16px' },
  { label: '۱۸ (بزرگ)', value: '18px' },
  { label: '۲۲ (بزرگ‌تر)', value: '22px' },
  { label: '۲۶ (تیتر)', value: '26px' },
  { label: '۳۲ (خیلی بزرگ)', value: '32px' },
];

const QUICK_COLORS = [
  { label: 'مشکی', value: '#0f172a' },
  { label: 'فیروزه‌ای', value: '#0f766e' },
  { label: 'قرمز', value: '#dc2626' },
  { label: 'نارنجی', value: '#d97706' },
  { label: 'سبز', value: '#059669' },
  { label: 'سرمه‌ای', value: '#1d4ed8' },
  { label: 'بنفش', value: '#7c3aed' },
  { label: 'خاکستری', value: '#475569' },
];

const BULLET_STYLES: Array<{
  id: string;
  tag: 'ul' | 'ol';
  cssType: string;
  preview: string;
  label: string;
}> = [
  { id: 'disc', tag: 'ul', cssType: 'disc', preview: '●', label: 'دایره توپر (پیش‌فرض)' },
  { id: 'circle', tag: 'ul', cssType: 'circle', preview: '○', label: 'دایره توخالی' },
  { id: 'square', tag: 'ul', cssType: 'square', preview: '■', label: 'مربع توپر' },
  { id: 'persian', tag: 'ol', cssType: 'persian', preview: '۱، ۲', label: 'شماره‌گذاری فارسی' },
  { id: 'decimal', tag: 'ol', cssType: 'decimal', preview: '1, 2', label: 'شماره‌گذاری عددی' },
  { id: 'lower-alpha', tag: 'ol', cssType: 'lower-alpha', preview: 'a, b', label: 'حروف انگلیسی کوچک' },
  { id: 'upper-roman', tag: 'ol', cssType: 'upper-roman', preview: 'I, II', label: 'اعداد رومی' },
];

const HIGHLIGHT_COLORS = [
  { label: 'زرد کلاسیک', value: '#fef08a' },
  { label: 'سبز ملایم', value: '#bbf7d0' },
  { label: 'آبی آسمانی', value: '#bae6fd' },
  { label: 'نارنجی گرم', value: '#fed7aa' },
  { label: 'صورتی روشن', value: '#fbcfe8' },
  { label: 'بنفش یاسی', value: '#e9d5ff' },
  { label: 'خاکستری روشن', value: '#e2e8f0' },
];

const EMOJI_GROUPS: Array<{ label: string; emojis: string[] }> = [
  {
    label: 'رسمی و اطلاعیه',
    emojis: ['📢', '📌', '📍', '📝', '📋', '📄', '✅', '☑️', '✔️', '⚠️', '🚨', '❗', '❓', '🔔', '📣', '🏛️'],
  },
  {
    label: 'آموزشی و فرهنگی',
    emojis: ['🎓', '📚', '📖', '✏️', '🖋️', '🏫', '🎭', '🎨', '🕌', '🤲', '🌟', '✨', '💡', '🤝', '👥', '🎤'],
  },
  {
    label: 'ورزشی و تربیت بدنی',
    emojis: ['⚽', '🏐', '🏀', '🏓', '🏸', '♟️', '🏃', '🏊', '🥾', '⛰️', '🥇', '🏆', '🏅', '💪', '🎯', '🩺'],
  },
  {
    label: 'زمان، سرا و ارتباط',
    emojis: ['🗓️', '📅', '⏰', '⏳', '🏠', '🛏️', '🔑', '🍽️', '☕', '📞', '📱', '✉️', '💬', '🙏', '🌹', '💚'],
  },
];

const compressInlineImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر'));
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) {
        reject(new Error('تصویر خالی است'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxDim = 1100;
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && file.size <= 350 * 1024) {
          resolve(dataUrl);
          return;
        }
        const ratio = Math.min(maxDim / width, maxDim / height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mime = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
        resolve(canvas.toDataURL(mime, 0.84));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });

const hasRichVisualContent = (html: string): boolean => {
  if (extractPlainText(html).length > 0) return true;
  return /<(img|table)\b/i.test(html);
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  valueHtml,
  onChange,
  customFonts,
  placeholder = 'متن کامل بخشنامه یا اطلاعیه را بنویسید. می‌توانید هر بخش از متن را انتخاب کرده و فونت، رنگ، اندازه، تراز، بولت، جدول یا تصویر داخل متن را اضافه کنید...',
  minHeightClass = 'min-h-[150px]',
  resetKey,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const isInternalChangeRef = useRef(false);

  const [selectedFont, setSelectedFont] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('#0f172a');
  const [selectedHighlight, setSelectedHighlight] = useState('#fef08a');
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyRight: false,
    justifyCenter: false,
    justifyLeft: false,
    justifyFull: false,
  });
  const [activeListStyle, setActiveListStyle] = useState<{
    tag: 'ul' | 'ol';
    cssType: string;
  } | null>(null);
  const [isEmpty, setIsEmpty] = useState(!hasRichVisualContent(valueHtml));

  // پنل‌های کشویی ابزارهای پیشرفته (بولت متنوع، هایلایت، ایموجی، جدول، تصویر داخل متن)
  const [openToolMenu, setOpenToolMenu] = useState<
    'bullets' | 'highlight' | 'emoji' | 'table' | 'image' | null
  >(null);

  // تنظیمات درج جدول
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(true);

  // تنظیمات درج تصویر در متن
  const [inlineImageUrl, setInlineImageUrl] = useState('');
  const [inlineImageWidth, setInlineImageWidth] = useState<'35%' | '60%' | '100%'>('60%');
  const [inlineImageAlign, setInlineImageAlign] = useState<'center' | 'right' | 'left'>('center');
  const [inlineImageError, setInlineImageError] = useState<string | null>(null);

  const fontOptions = useMemo(
    () => getAvailableFontOptions(customFonts),
    [customFonts]
  );

  // همگام‌سازی مقدار بیرونی فقط هنگام شروع ویرایش یا پاک کردن فرم
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    const el = editorRef.current;
    if (!el) return;
    const sanitized = sanitizeRichHtml(valueHtml);
    if (el.innerHTML !== sanitized) {
      el.innerHTML = sanitized;
    }
    setIsEmpty(!hasRichVisualContent(sanitized));
  }, [valueHtml, resetKey]);

  const updateToolbarState = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyFull: document.queryCommandState('justifyFull'),
      });
    } catch {
      // ignore in environments without command state support
    }
    try {
      const editor = editorRef.current;
      const sel = window.getSelection();
      if (!editor || !sel || sel.rangeCount === 0) {
        setActiveListStyle(null);
        return;
      }
      let node: Node | null = sel.anchorNode;
      let found: { tag: 'ul' | 'ol'; cssType: string } | null = null;
      while (node && node !== editor) {
        if (node instanceof HTMLElement && (node.tagName === 'UL' || node.tagName === 'OL')) {
          const tag = node.tagName.toLowerCase() as 'ul' | 'ol';
          const cssType = node.style.listStyleType || (tag === 'ul' ? 'disc' : 'decimal');
          found = { tag, cssType };
          break;
        }
        node = node.parentNode;
      }
      setActiveListStyle(found);
    } catch {
      setActiveListStyle(null);
    }
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    const editor = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !editor) return;
    const range = sel.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
    updateToolbarState();
  };

  const restoreSelection = (): Range | null => {
    const editor = editorRef.current;
    if (!editor) return null;
    editor.focus();
    const sel = window.getSelection();
    if (!sel) return null;

    if (savedRangeRef.current && editor.contains(savedRangeRef.current.commonAncestorContainer)) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      return savedRangeRef.current;
    }

    if (sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      return sel.getRangeAt(0);
    }

    const fallbackRange = document.createRange();
    fallbackRange.selectNodeContents(editor);
    fallbackRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(fallbackRange);
    return fallbackRange;
  };

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const rawHtml = editor.innerHTML;
    const sanitized = sanitizeRichHtml(rawHtml);
    const plain = extractPlainText(sanitized);
    setIsEmpty(!hasRichVisualContent(sanitized));
    isInternalChangeRef.current = true;
    onChange(sanitized, plain);
  };

  const handleExecCommand = (command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    emitChange();
  };

  const unwrapListItemsToParagraphs = (listEl: HTMLElement, targetItems: HTMLElement[]) => {
    const parent = listEl.parentNode;
    if (!parent || targetItems.length === 0) return;
    const allItems = Array.from(listEl.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && c.tagName === 'LI'
    );
    const targetSet = new Set(targetItems);
    const createdParagraphs: HTMLElement[] = [];

    let bufferList: HTMLElement | null = null;
    const createSubList = () => {
      const clone = document.createElement(listEl.tagName.toLowerCase());
      const styleAttr = listEl.getAttribute('style');
      if (styleAttr) clone.setAttribute('style', styleAttr);
      return clone;
    };

    allItems.forEach((li) => {
      if (targetSet.has(li)) {
        if (bufferList) {
          parent.insertBefore(bufferList, listEl);
          bufferList = null;
        }
        const p = document.createElement('p');
        while (li.firstChild) {
          p.appendChild(li.firstChild);
        }
        if (!p.innerHTML.trim()) {
          p.innerHTML = '<br />';
        }
        parent.insertBefore(p, listEl);
        createdParagraphs.push(p);
      } else {
        if (!bufferList) bufferList = createSubList();
        bufferList.appendChild(li);
      }
    });

    if (bufferList) {
      parent.insertBefore(bufferList, listEl);
    }
    parent.removeChild(listEl);

    if (createdParagraphs.length > 0) {
      const sel = window.getSelection();
      if (sel) {
        const lastP = createdParagraphs[createdParagraphs.length - 1];
        const newRange = document.createRange();
        newRange.selectNodeContents(lastP);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      }
    }
  };

  const removeBulletListFromSelection = (removeEntireList = false) => {
    const editor = editorRef.current;
    if (!editor) return;
    const range = restoreSelection();
    const sel = window.getSelection();
    if (!range || !sel) return;

    const listsToProcess = new Map<HTMLElement, Set<HTMLElement>>();

    const registerLi = (li: HTMLElement) => {
      const listEl = li.closest('ul, ol');
      if (listEl instanceof HTMLElement && editor.contains(listEl)) {
        if (!listsToProcess.has(listEl)) {
          listsToProcess.set(listEl, new Set());
        }
        listsToProcess.get(listEl)!.add(li);
      }
    };

    if (range.collapsed) {
      let node: Node | null = range.startContainer;
      while (node && node !== editor) {
        if (node instanceof HTMLElement && node.tagName === 'LI') {
          if (removeEntireList) {
            const listEl = node.closest('ul, ol');
            if (listEl instanceof HTMLElement && editor.contains(listEl)) {
              Array.from(listEl.children).forEach((c) => {
                if (c instanceof HTMLElement && c.tagName === 'LI') registerLi(c);
              });
            }
          } else {
            registerLi(node);
          }
          break;
        }
        node = node.parentNode;
      }
    } else {
      editor.querySelectorAll('li').forEach((li) => {
        try {
          if (range.intersectsNode(li)) {
            if (removeEntireList) {
              const listEl = li.closest('ul, ol');
              if (listEl instanceof HTMLElement) {
                Array.from(listEl.children).forEach((c) => {
                  if (c instanceof HTMLElement && c.tagName === 'LI') registerLi(c);
                });
              }
            } else {
              registerLi(li);
            }
          }
        } catch {
          // ignore range intersection edge cases
        }
      });
    }

    if (listsToProcess.size === 0) {
      let node: Node | null = sel.anchorNode;
      while (node && node !== editor) {
        if (node instanceof HTMLElement && (node.tagName === 'UL' || node.tagName === 'OL')) {
          const allLi = Array.from(node.children).filter(
            (c): c is HTMLElement => c instanceof HTMLElement && c.tagName === 'LI'
          );
          unwrapListItemsToParagraphs(node, allLi);
          break;
        }
        node = node.parentNode;
      }
    } else {
      listsToProcess.forEach((itemsSet, listEl) => {
        unwrapListItemsToParagraphs(listEl, Array.from(itemsSet));
      });
    }

    setOpenToolMenu(null);
    updateToolbarState();
    saveSelection();
    emitChange();
  };

  const applyBulletListStyle = (tag: 'ul' | 'ol', cssType: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    restoreSelection();

    const sel = window.getSelection();
    const findClosestList = (): HTMLElement | null => {
      if (!sel || sel.rangeCount === 0) return null;
      let node: Node | null = sel.anchorNode;
      while (node && node !== editor) {
        if (node instanceof HTMLElement && (node.tagName === 'UL' || node.tagName === 'OL')) {
          return node;
        }
        node = node.parentNode;
      }
      return null;
    };

    const existingList = findClosestList();
    if (
      existingList &&
      existingList.tagName.toLowerCase() === tag &&
      (existingList.style.listStyleType || (tag === 'ul' ? 'disc' : 'decimal')) === cssType
    ) {
      // اگر بولت فعلی دوباره انتخاب شد، بولت برداشته و به متن عادی تبدیل می‌شود
      removeBulletListFromSelection(false);
      return;
    }

    if (!existingList) {
      document.execCommand(tag === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false);
    } else if (existingList.tagName.toLowerCase() !== tag) {
      // تبدیل بین فهرست نقطه‌ای و شماره‌ای و سپس اعمال نوع بولت انتخابی
      document.execCommand(tag === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false);
      const afterToggle = findClosestList();
      if (!afterToggle) {
        document.execCommand(tag === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', false);
      }
    }

    const activeList = findClosestList();
    if (activeList) {
      activeList.style.listStyleType = cssType;
      activeList.style.paddingRight = '1.5rem';
    } else {
      // حالت جایگزین در صورت خالی بودن کامل ویرایشگر
      const listEl = document.createElement(tag);
      listEl.style.listStyleType = cssType;
      listEl.style.paddingRight = '1.5rem';
      const li = document.createElement('li');
      li.innerHTML = '<br />';
      listEl.appendChild(li);
      const range = restoreSelection();
      if (range) {
        range.insertNode(listEl);
        const caret = document.createRange();
        caret.setStart(li, 0);
        caret.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(caret);
        savedRangeRef.current = caret.cloneRange();
      }
    }

    setOpenToolMenu(null);
    updateToolbarState();
    saveSelection();
    emitChange();
  };

  const applyHighlightToSelection = (bgColor: string) => {
    const range = restoreSelection();
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!range || !editor || !sel) return;

    const mark = document.createElement('mark');
    mark.style.backgroundColor = bgColor;
    mark.style.color = '#0f172a';
    mark.style.padding = '1px 4px';
    mark.style.borderRadius = '4px';

    if (range.collapsed) {
      const zeroWidth = document.createTextNode('\u200B');
      mark.appendChild(zeroWidth);
      range.insertNode(mark);
      const caret = document.createRange();
      caret.setStart(zeroWidth, 1);
      caret.collapse(true);
      sel.removeAllRanges();
      sel.addRange(caret);
      savedRangeRef.current = caret.cloneRange();
    } else {
      const fragment = range.extractContents();
      const temp = document.createElement('div');
      temp.appendChild(fragment);
      temp.querySelectorAll('mark').forEach((m) => {
        const parent = m.parentNode;
        if (!parent) return;
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
      });
      temp.querySelectorAll('span').forEach((s) => {
        if (s instanceof HTMLElement && s.style.backgroundColor) {
          s.style.backgroundColor = '';
        }
      });
      while (temp.firstChild) {
        mark.appendChild(temp.firstChild);
      }
      range.insertNode(mark);
      const newRange = document.createRange();
      newRange.selectNodeContents(mark);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
    }

    setSelectedHighlight(bgColor);
    setOpenToolMenu(null);
    emitChange();
  };

  const removeHighlightFromSelection = () => {
    const range = restoreSelection();
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!range || !editor || !sel) return;

    let handled = false;
    if (range.collapsed) {
      let node: Node | null = range.startContainer;
      while (node && node !== editor) {
        if (node instanceof HTMLElement && node.tagName === 'MARK') {
          const parent = node.parentNode;
          if (parent) {
            const first = node.firstChild;
            while (node.firstChild) parent.insertBefore(node.firstChild, node);
            parent.removeChild(node);
            if (first) {
              const caret = document.createRange();
              caret.selectNodeContents(first);
              caret.collapse(false);
              sel.removeAllRanges();
              sel.addRange(caret);
              savedRangeRef.current = caret.cloneRange();
            }
            handled = true;
          }
          break;
        }
        node = node.parentNode;
      }
    } else {
      const marks = Array.from(editor.querySelectorAll('mark'));
      marks.forEach((m) => {
        try {
          if (range.intersectsNode(m) && m.parentNode) {
            const parent = m.parentNode;
            while (m.firstChild) parent.insertBefore(m.firstChild, m);
            parent.removeChild(m);
            handled = true;
          }
        } catch {
          // ignore
        }
      });
      editor.querySelectorAll('span').forEach((sp) => {
        try {
          if (sp instanceof HTMLElement && sp.style.backgroundColor && range.intersectsNode(sp)) {
            sp.style.backgroundColor = '';
            handled = true;
          }
        } catch {
          // ignore
        }
      });
    }

    if (handled) {
      emitChange();
    }
    setOpenToolMenu(null);
  };

  const insertEmojiAtCursor = (emoji: string) => {
    const range = restoreSelection();
    const sel = window.getSelection();
    if (!range || !sel) return;

    range.deleteContents();
    const textNode = document.createTextNode(emoji);
    range.insertNode(textNode);

    const caret = document.createRange();
    caret.setStartAfter(textNode);
    caret.collapse(true);
    sel.removeAllRanges();
    sel.addRange(caret);
    savedRangeRef.current = caret.cloneRange();

    emitChange();
  };

  const handleInsertTable = () => {
    const rowsCount = Math.max(1, Math.min(12, Number(tableRows) || 3));
    const colsCount = Math.max(1, Math.min(8, Number(tableCols) || 3));
    const range = restoreSelection();
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!range || !editor || !sel) return;

    const table = document.createElement('table');
    table.setAttribute('dir', 'rtl');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.margin = '12px 0';

    if (tableHasHeader) {
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      for (let c = 0; c < colsCount; c++) {
        const th = document.createElement('th');
        th.textContent = `عنوان ${c + 1}`;
        th.style.border = '1px solid #cbd5e1';
        th.style.padding = '8px 10px';
        th.style.backgroundColor = '#f1f5f9';
        th.style.fontWeight = 'bold';
        th.style.textAlign = 'right';
        tr.appendChild(th);
      }
      thead.appendChild(tr);
      table.appendChild(thead);
    }

    const tbody = document.createElement('tbody');
    const bodyRows = tableHasHeader ? Math.max(1, rowsCount - 1) : rowsCount;
    for (let r = 0; r < bodyRows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < colsCount; c++) {
        const td = document.createElement('td');
        td.innerHTML = '&nbsp;';
        td.style.border = '1px solid #cbd5e1';
        td.style.padding = '7px 10px';
        td.style.textAlign = 'right';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    const spacer = document.createElement('p');
    spacer.innerHTML = '<br />';

    const frag = document.createDocumentFragment();
    frag.appendChild(table);
    frag.appendChild(spacer);

    range.deleteContents();
    range.insertNode(frag);

    const firstCell = table.querySelector('th, td');
    if (firstCell) {
      const caret = document.createRange();
      caret.selectNodeContents(firstCell);
      caret.collapse(false);
      sel.removeAllRanges();
      sel.addRange(caret);
      savedRangeRef.current = caret.cloneRange();
    }

    setOpenToolMenu(null);
    emitChange();
  };

  const insertInlineImageIntoEditor = (src: string) => {
    const cleanSrc = src.trim();
    if (!isSafeMediaUrl(cleanSrc)) {
      setInlineImageError('آدرس یا فرمت تصویر معتبر نیست.');
      return;
    }

    const range = restoreSelection();
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!range || !editor || !sel) return;

    const img = document.createElement('img');
    img.setAttribute('src', cleanSrc);
    img.setAttribute('alt', 'تصویر داخل متن اطلاعیه');
    img.style.maxWidth = '100%';
    img.style.width = inlineImageWidth;
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.borderRadius = '12px';
    img.style.cursor = 'zoom-in';

    if (inlineImageAlign === 'center') {
      img.style.margin = '12px auto';
    } else if (inlineImageAlign === 'right') {
      img.style.margin = '12px 0 12px auto';
    } else {
      img.style.margin = '12px auto 12px 0';
    }

    const spacer = document.createElement('p');
    spacer.innerHTML = '<br />';

    const frag = document.createDocumentFragment();
    frag.appendChild(img);
    frag.appendChild(spacer);

    range.deleteContents();
    range.insertNode(frag);

    const caret = document.createRange();
    caret.setStart(spacer, 0);
    caret.collapse(true);
    sel.removeAllRanges();
    sel.addRange(caret);
    savedRangeRef.current = caret.cloneRange();

    setInlineImageUrl('');
    setInlineImageError(null);
    setOpenToolMenu(null);
    emitChange();
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setInlineImageError('حجم فایل تصویر نباید بیشتر از ۶ مگابایت باشد.');
      return;
    }
    try {
      setInlineImageError(null);
      const dataUrl = await compressInlineImage(file);
      insertInlineImageIntoEditor(dataUrl);
    } catch {
      setInlineImageError('خطا در پردازش تصویر انتخابی.');
    }
  };

  const applyInlineStyleToSelection = (
    cssProperty: 'fontFamily' | 'fontSize' | 'color',
    cssValue: string
  ) => {
    if (!cssValue) return;
    const range = restoreSelection();
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!range || !editor || !sel) return;

    const span = document.createElement('span');
    span.style[cssProperty] = cssValue;

    if (range.collapsed) {
      const zeroWidth = document.createTextNode('\u200B');
      span.appendChild(zeroWidth);
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.setStart(zeroWidth, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
    } else {
      const fragment = range.extractContents();
      const tempContainer = document.createElement('div');
      tempContainer.appendChild(fragment);
      tempContainer.querySelectorAll('span, font').forEach((child) => {
        if (child instanceof HTMLElement) {
          child.style[cssProperty] = '';
          if (cssProperty === 'color' && child.tagName === 'FONT') {
            child.removeAttribute('color');
          }
          if (cssProperty === 'fontFamily' && child.tagName === 'FONT') {
            child.removeAttribute('face');
          }
        }
      });

      while (tempContainer.firstChild) {
        span.appendChild(tempContainer.firstChild);
      }

      range.insertNode(span);

      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
    }

    emitChange();
  };

  const handleClearFormatting = () => {
    const range = restoreSelection();
    const editor = editorRef.current;
    if (!range || !editor) return;
    document.execCommand('removeFormat', false);
    if (!range.collapsed) {
      // حذف تگ‌های هایلایت یا بولت در صورت وجود در محدوده انتخابی
      editor.querySelectorAll('mark').forEach((m) => {
        try {
          if (range.intersectsNode(m) && m.parentNode) {
            const p = m.parentNode;
            while (m.firstChild) p.insertBefore(m.firstChild, m);
            p.removeChild(m);
          }
        } catch {
          // ignore
        }
      });
      const text = range.toString();
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      const sel = window.getSelection();
      if (sel) {
        const newRange = document.createRange();
        newRange.selectNodeContents(textNode);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      }
    } else {
      removeHighlightFromSelection();
    }
    updateToolbarState();
    emitChange();
  };

  return (
    <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-visible focus-within:ring-2 focus-within:ring-teal-500 transition">
      {/* نوار ابزار ویرایشگر متنی پیشرفته */}
      <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl">
        {/* انتخاب فونت برای متن انتخاب‌شده */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1">
          <Type className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <select
            aria-label="فونت بخش انتخاب‌شده"
            value={selectedFont}
            onMouseDown={saveSelection}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedFont(val);
              if (val) applyInlineStyleToSelection('fontFamily', val);
            }}
            className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer max-w-[140px]"
          >
            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
              انتخاب فونت...
            </option>
            {fontOptions.map((font) => (
              <option
                key={font.id}
                value={font.cssFamily}
                style={{ fontFamily: font.cssFamily }}
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {font.isCustom ? `★ ${font.name}` : font.name}
              </option>
            ))}
          </select>
        </div>

        {/* انتخاب اندازه فونت */}
        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1">
          <select
            aria-label="اندازه فونت بخش انتخاب‌شده"
            value={selectedSize}
            onMouseDown={saveSelection}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedSize(val);
              if (val) applyInlineStyleToSelection('fontSize', val);
            }}
            className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
              اندازه...
            </option>
            {FONT_SIZES.map((sz) => (
              <option
                key={sz.value}
                value={sz.value}
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {sz.label}
              </option>
            ))}
          </select>
        </div>

        <span className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* بُلد / ایتالیک / زیرخط */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleExecCommand('bold');
          }}
          title="بُلد (ضخیم کردن متن انتخاب‌شده)"
          className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
            activeFormats.bold
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleExecCommand('italic');
          }}
          title="ایتالیک (کج کردن متن انتخاب‌شده)"
          className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
            activeFormats.italic
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleExecCommand('underline');
          }}
          title="زیرخط (Underline)"
          className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
            activeFormats.underline
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <span className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* پالت رنگ متن سریع + انتخابگر رنگ آزاد */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1">
          <Palette className="w-3.5 h-3.5 text-teal-600 shrink-0 ml-0.5" />
          {QUICK_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={`رنگ ${c.label}`}
              onMouseDown={(e) => {
                e.preventDefault();
                setSelectedColor(c.value);
                applyInlineStyleToSelection('color', c.value);
              }}
              className={`w-4 h-4 rounded-full border transition cursor-pointer hover:scale-110 ${
                selectedColor === c.value
                  ? 'ring-2 ring-teal-500 ring-offset-1 border-white'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
          <label
            title="انتخاب رنگ دلخواه"
            onMouseDown={saveSelection}
            className="flex items-center gap-1 mr-1 cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-300"
          >
            <input
              type="color"
              value={selectedColor}
              onMouseDown={saveSelection}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedColor(val);
                applyInlineStyleToSelection('color', val);
              }}
              className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer rounded"
            />
          </label>
        </div>

        <span className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* تراز متن: راست‌چین، وسط‌چین، چپ‌چین، هم‌تراز */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleExecCommand('justifyRight');
          }}
          title="راست‌چین"
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            activeFormats.justifyRight
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleExecCommand('justifyCenter');
          }}
          title="وسط‌چین"
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            activeFormats.justifyCenter
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleExecCommand('justifyLeft');
          }}
          title="چپ‌چین"
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            activeFormats.justifyLeft
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleExecCommand('justifyFull');
          }}
          title="تراز کامل دو طرف (Justify)"
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            activeFormats.justifyFull
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>

        <span className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* بولت‌های متنوع، فهرست شماره‌ای و حذف بولت */}
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setOpenToolMenu((prev) => (prev === 'bullets' ? null : 'bullets'));
            }}
            title="ایجاد فهرست با بولت‌های متنوع و شماره‌گذاری (برای لغو، روی بولت فعال کلیک کنید)"
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              openToolMenu === 'bullets' || activeListStyle
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>بولت</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              removeBulletListFromSelection(false);
            }}
            title="حذف بولت / تبدیل بند فهرست به متن عادی"
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
              activeListStyle
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 hover:bg-rose-100'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <ListX className="w-3.5 h-3.5" />
          </button>

          {openToolMenu === 'bullets' && (
            <div className="absolute right-0 top-full mt-1.5 z-30 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-2 space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400">
                <span>انتخاب نوع بولت / فهرست</span>
                <button
                  type="button"
                  onClick={() => setOpenToolMenu(null)}
                  className="hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {BULLET_STYLES.map((b) => {
                const isActiveStyle =
                  activeListStyle?.tag === b.tag && activeListStyle?.cssType === b.cssType;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyBulletListStyle(b.tag, b.cssType);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                      isActiveStyle
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-700 dark:hover:text-teal-300'
                    }`}
                  >
                    <span>{b.label}{isActiveStyle ? ' (فعال — کلیک = حذف)' : ''}</span>
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                        isActiveStyle
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {b.preview}
                    </span>
                  </button>
                );
              })}

              <div className="pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-700 space-y-1">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    removeBulletListFromSelection(false);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ListX className="w-3.5 h-3.5" />
                  <span>حذف بولت از متن انتخاب‌شده</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    removeBulletListFromSelection(true);
                  }}
                  className="w-full px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  تبدیل کل فهرست جاری به متن عادی
                </button>
              </div>
            </div>
          )}
        </div>

        {/* هایلایت بخشی از متن */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setOpenToolMenu((prev) => (prev === 'highlight' ? null : 'highlight'));
            }}
            title="هایلایت کردن بخش انتخاب‌شده از متن"
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              openToolMenu === 'highlight'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span>هایلایت</span>
          </button>

          {openToolMenu === 'highlight' && (
            <div className="absolute right-0 top-full mt-1.5 z-30 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-100">
                <span>رنگ پس‌زمینه (هایلایت متن)</span>
                <button
                  type="button"
                  onClick={() => setOpenToolMenu(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {HIGHLIGHT_COLORS.map((hc) => (
                  <button
                    key={hc.value}
                    type="button"
                    title={hc.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyHighlightToSelection(hc.value);
                    }}
                    className={`w-7 h-7 rounded-lg border transition cursor-pointer hover:scale-110 ${
                      selectedHighlight === hc.value
                        ? 'ring-2 ring-teal-500 border-slate-900'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                    style={{ backgroundColor: hc.value }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                <label
                  onMouseDown={saveSelection}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <input
                    type="color"
                    value={selectedHighlight}
                    onMouseDown={saveSelection}
                    onChange={(e) => applyHighlightToSelection(e.target.value)}
                    className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded"
                  />
                  <span>رنگ دلخواه</span>
                </label>

                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    removeHighlightFromSelection();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[11px] hover:bg-rose-100 cursor-pointer"
                >
                  حذف هایلایت
                </button>
              </div>
            </div>
          )}
        </div>

        {/* افزودن ایموجی */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setOpenToolMenu((prev) => (prev === 'emoji' ? null : 'emoji'));
            }}
            title="درج ایموجی و نشانه‌های گرافیکی در متن"
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              openToolMenu === 'emoji'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-amber-500" />
            <span>ایموجی</span>
          </button>

          {openToolMenu === 'emoji' && (
            <div className="absolute left-0 sm:right-0 top-full mt-1.5 z-30 w-72 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-100 sticky top-0 bg-white dark:bg-slate-800 pb-1 border-b border-slate-100 dark:border-slate-700">
                <span>انتخاب و درج ایموجی در متن</span>
                <button
                  type="button"
                  onClick={() => setOpenToolMenu(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {EMOJI_GROUPS.map((grp) => (
                <div key={grp.label} className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400">{grp.label}</div>
                  <div className="grid grid-cols-8 gap-1">
                    {grp.emojis.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertEmojiAtCursor(em);
                        }}
                        className="h-7 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/50 text-base flex items-center justify-center transition hover:scale-115 cursor-pointer"
                        title={`درج ${em}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* درج جدول در متن */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setOpenToolMenu((prev) => (prev === 'table' ? null : 'table'));
            }}
            title="ایجاد و درج جدول در متن"
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              openToolMenu === 'table'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>جدول</span>
          </button>

          {openToolMenu === 'table' && (
            <div className="absolute right-0 top-full mt-1.5 z-30 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-3 space-y-3 text-xs">
              <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-100">
                <span>ایجاد جدول جدید در متن</span>
                <button
                  type="button"
                  onClick={() => setOpenToolMenu(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">تعداد ردیف</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={tableRows}
                    onChange={(e) => setTableRows(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">تعداد ستون</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={tableCols}
                    onChange={(e) => setTableCols(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={tableHasHeader}
                  onChange={(e) => setTableHasHeader(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <span>ردیف اول به عنوان سرستون جدول باشد</span>
              </label>
              <button
                type="button"
                onClick={handleInsertTable}
                className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer"
              >
                درج جدول در محل نشانگر
              </button>
            </div>
          )}
        </div>

        {/* درج تصویر در داخل متن */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setOpenToolMenu((prev) => (prev === 'image' ? null : 'image'));
            }}
            title="وارد کردن تصویر در داخل متن"
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              openToolMenu === 'image'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>تصویر در متن</span>
          </button>

          {openToolMenu === 'image' && (
            <div className="absolute left-0 sm:right-0 top-full mt-1.5 z-30 w-72 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-3 space-y-3 text-xs">
              <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-100">
                <span>افزودن تصویر داخل متن</span>
                <button
                  type="button"
                  onClick={() => setOpenToolMenu(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">عرض در متن</label>
                  <select
                    value={inlineImageWidth}
                    onChange={(e) => setInlineImageWidth(e.target.value as '35%' | '60%' | '100%')}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-[11px] font-bold"
                  >
                    <option value="35%">کوچک (۳۵٪)</option>
                    <option value="60%">متوسط (۶۰٪)</option>
                    <option value="100%">تمام‌عرض (۱۰۰٪)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">چینش تصویر</label>
                  <select
                    value={inlineImageAlign}
                    onChange={(e) => setInlineImageAlign(e.target.value as 'center' | 'right' | 'left')}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-[11px] font-bold"
                  >
                    <option value="center">وسط‌چین</option>
                    <option value="right">راست‌چین</option>
                    <option value="left">چپ‌چین</option>
                  </select>
                </div>
              </div>

              <label className="w-full py-2 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>انتخاب فایل تصویر از سیستم</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleInlineImageUpload}
                  className="hidden"
                />
              </label>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500">یا درج آدرس اینترنتی تصویر:</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    dir="ltr"
                    value={inlineImageUrl}
                    onChange={(e) => setInlineImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => insertInlineImageIntoEditor(inlineImageUrl)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] cursor-pointer"
                  >
                    درج
                  </button>
                </div>
              </div>

              {inlineImageError && (
                <p className="text-[11px] font-bold text-rose-600">{inlineImageError}</p>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleClearFormatting();
          }}
          title="حذف قالب‌بندی بخش انتخاب‌شده"
          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ناحیه تایپ و ویرایش */}
      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute top-3 right-4 left-4 text-xs text-slate-400 leading-relaxed select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dir="rtl"
          onInput={emitChange}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onBlur={saveSelection}
          onFocus={updateToolbarState}
          className={`${minHeightClass} max-h-96 overflow-y-auto px-4 py-3 text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none [&_ul:not([style*='list-style-type'])]:list-disc [&_ol:not([style*='list-style-type'])]:list-decimal [&_ul]:pr-6 [&_ol]:pr-6 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_p]:mb-1.5 [&_mark]:text-slate-900 [&_mark]:px-1 [&_mark]:rounded [&_table]:w-full [&_table]:border-collapse [&_table]:my-2.5 [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-600 [&_th]:bg-slate-100 dark:[&_th]:bg-slate-800 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:font-bold [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-600 [&_td]:px-2.5 [&_td]:py-1.5 [&_img]:max-w-full [&_img]:rounded-xl`}
        />
      </div>

      {/* راهنمای کوتاه پایین ویرایشگر */}
      <div className="px-3.5 py-1.5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200/70 dark:border-slate-700/70 rounded-b-2xl text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>
          نکته: می‌توانید متن را انتخاب کرده و فونت، رنگ، هایلایت، ایموجی، تراز (راست/وسط/چپ)، بولت‌های قابل حذف، جدول یا تصویر داخل متن را اضافه کنید.
        </span>
      </div>
    </div>
  );
};

interface RichTextDisplayProps {
  html?: string;
  fallbackText: string;
  className?: string;
  onImageClick?: (src: string) => void;
}

export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  html,
  fallbackText,
  className = 'text-xs text-slate-700 dark:text-slate-300 leading-relaxed',
  onImageClick,
}) => {
  const [internalLightboxSrc, setInternalLightboxSrc] = useState<string | null>(null);
  const safeHtml = useMemo(() => (html ? sanitizeRichHtml(html) : ''), [html]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target && target.tagName === 'IMG') {
      const src = target.getAttribute('src');
      if (src) {
        if (onImageClick) {
          onImageClick(src);
        } else {
          setInternalLightboxSrc(src);
        }
      }
    }
  };

  if (safeHtml && hasRichVisualContent(safeHtml)) {
    return (
      <>
        <div
          dir="rtl"
          onClick={handleContainerClick}
          className={`${className} break-words overflow-x-auto [&_ul:not([style*='list-style-type'])]:list-disc [&_ol:not([style*='list-style-type'])]:list-decimal [&_ul]:pr-6 [&_ol]:pr-6 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_p]:mb-1.5 [&_mark]:text-slate-900 [&_mark]:px-1 [&_mark]:rounded [&_table]:w-full [&_table]:border-collapse [&_table]:my-2.5 [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-600 [&_th]:bg-slate-100 dark:[&_th]:bg-slate-800/80 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:font-bold [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-600 [&_td]:px-2.5 [&_td]:py-1.5 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:cursor-zoom-in [&_img]:transition-opacity hover:[&_img]:opacity-95`}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        {!onImageClick && internalLightboxSrc && (
          <ImageLightboxModal
            src={internalLightboxSrc}
            alt="تصویر داخل متن اطلاعیه"
            onClose={() => setInternalLightboxSrc(null)}
          />
        )}
      </>
    );
  }

  return (
    <p className={`${className} whitespace-pre-line break-words`}>
      {fallbackText}
    </p>
  );
};
