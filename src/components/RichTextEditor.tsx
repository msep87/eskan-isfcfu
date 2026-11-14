import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  List,
  Eraser,
  Type,
  Palette,
} from 'lucide-react';
import { CustomFont } from '../types';
import { getAvailableFontOptions } from '../utils/fonts';
import { sanitizeRichHtml, extractPlainText } from '../utils/sanitizeHtml';

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

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  valueHtml,
  onChange,
  customFonts,
  placeholder = 'متن کامل بخشنامه یا اطلاعیه را بنویسید. می‌توانید هر بخش از متن را انتخاب کرده و فونت، رنگ، اندازه، بُلد یا ایتالیک آن را تغییر دهید...',
  minHeightClass = 'min-h-[150px]',
  resetKey,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const isInternalChangeRef = useRef(false);

  const [selectedFont, setSelectedFont] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('#0f172a');
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [isEmpty, setIsEmpty] = useState(!extractPlainText(valueHtml));

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
    setIsEmpty(!extractPlainText(sanitized));
  }, [valueHtml, resetKey]);

  const updateToolbarState = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
    } catch {
      // ignore in environments without command state support
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
    setIsEmpty(!plain);
    isInternalChangeRef.current = true;
    onChange(sanitized, plain);
  };

  const handleExecCommand = (command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    emitChange();
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
      // حذف استایل تکراری از spanهای داخلی تا قالب جدید روی کل بخش انتخاب‌شده اعمال شود
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
    if (!range) return;
    document.execCommand('removeFormat', false);
    if (!range.collapsed) {
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
    }
    updateToolbarState();
    emitChange();
  };

  return (
    <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 transition">
      {/* نوار ابزار ویرایشگر متنی پیشرفته */}
      <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
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

        {/* تراز متن و لیست */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleExecCommand('justifyRight');
          }}
          title="راست‌چین"
          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
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
          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
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
          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleExecCommand('insertUnorderedList');
          }}
          title="فهرست نقطه‌ای"
          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <List className="w-3.5 h-3.5" />
        </button>

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
          className={`${minHeightClass} max-h-80 overflow-y-auto px-4 py-3 text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5 [&_p]:mb-1.5`}
        />
      </div>

      {/* راهنمای کوتاه پایین ویرایشگر */}
      <div className="px-3.5 py-1.5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200/70 dark:border-slate-700/70 text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>
          نکته: با کشیدن ماوس هر کلمه یا بخشی از متن را انتخاب کنید و فونت، رنگ، اندازه، بُلد یا ایتالیک آن را جداگانه تغییر دهید.
        </span>
      </div>
    </div>
  );
};

interface RichTextDisplayProps {
  html?: string;
  fallbackText: string;
  className?: string;
}

export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  html,
  fallbackText,
  className = 'text-xs text-slate-700 dark:text-slate-300 leading-relaxed',
}) => {
  const safeHtml = useMemo(() => (html ? sanitizeRichHtml(html) : ''), [html]);

  if (safeHtml && extractPlainText(safeHtml).length > 0) {
    return (
      <div
        dir="rtl"
        className={`${className} break-words [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5 [&_p]:mb-1.5`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }

  return (
    <p className={`${className} whitespace-pre-line break-words`}>
      {fallbackText}
    </p>
  );
};
