import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AppSettings,
  GraduationClearanceRequest,
  GraduationStaff,
  Message,
} from '../types';
import { CLEARANCE_UNITS_META, Storage, normalizePersianSearch } from '../utils/storage';
import { GraduationClearancePrintModal } from './GraduationClearancePrintModal';
import {
  GraduationCap,
  FileCheck2,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Printer,
  FileSpreadsheet,
  Archive,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  User,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  X,
  AlertTriangle,
  Stamp,
  Layers,
  Filter,
  BookOpen,
} from 'lucide-react';

interface GraduationDashboardProps {
  staff: GraduationStaff;
  messages: Message[];
  settings: AppSettings;
  onDataChange: () => void;
  onOpenMessages: () => void;
  onOpenUserGuide: (role?: 'graduation') => void;
}

type ClearanceFilter = 'all' | 'ready_to_finalize' | 'finalized' | 'in_progress' | 'has_rejection';

function escapeHtml(raw: string | undefined | null): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSingleClearancePageHtml(
  clearance: GraduationClearanceRequest,
  settings: AppSettings,
  isLast: boolean
): string {
  const approvedCount = CLEARANCE_UNITS_META.filter(
    (u) => clearance.units?.[u.role]?.status === 'approved'
  ).length;
  const isCompleted = clearance.status === 'completed' || approvedCount === CLEARANCE_UNITS_META.length;

  const rowsHtml = CLEARANCE_UNITS_META.map((u, idx) => {
    const rec = clearance.units?.[u.role];
    const st = rec?.status || 'pending';
    const statusText =
      st === 'approved' ? 'تایید شد' : st === 'rejected' ? 'دارای نقص' : 'در انتظار';
    const statusColor =
      st === 'approved' ? '#047857' : st === 'rejected' ? '#be123c' : '#b45309';

    return `
      <tr style="background:${idx % 2 === 1 ? '#f8fafc' : '#ffffff'}">
        <td style="border:1px solid #94a3b8;padding:5px 6px;text-align:center;font-weight:700;">${idx + 1}</td>
        <td style="border:1px solid #94a3b8;padding:5px 8px;font-weight:800;color:#0f172a;">${escapeHtml(u.label)}</td>
        <td style="border:1px solid #94a3b8;padding:5px 6px;text-align:center;font-weight:800;color:${statusColor};">${statusText}</td>
        <td style="border:1px solid #94a3b8;padding:5px 8px;">${escapeHtml(rec?.reviewerName || '---')}</td>
        <td style="border:1px solid #94a3b8;padding:5px 6px;text-align:center;font-size:10px;">${escapeHtml(rec?.reviewedAt || '---')}</td>
        <td style="border:1px solid #94a3b8;padding:5px 8px;font-size:10.5px;">${escapeHtml(rec?.note || '---')}</td>
      </tr>
    `;
  }).join('');

  const logoHtml = settings.customLogoUrl
    ? `<img src="${escapeHtml(settings.customLogoUrl)}" alt="نشان دانشگاه" style="width:58px;height:58px;object-fit:contain;border-radius:8px;border:1px solid #cbd5e1;padding:3px;" />`
    : `<div style="width:58px;height:58px;border-radius:10px;border:2px solid #0f766e;background:#f0fdfa;display:flex;align-items:center;justify-content:center;font-weight:900;color:#0f766e;font-size:20px;">ف</div>`;

  const photoHtml = clearance.studentPhotoUrl
    ? `<img src="${escapeHtml(clearance.studentPhotoUrl)}" alt="${escapeHtml(clearance.studentName)}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="font-size:10px;color:#94a3b8;font-weight:700;text-align:center;padding:6px;">محل الصاق عکس</div>`;

  const gradBoxHtml = clearance.graduationFinalized
    ? `
      <div style="border:1.5px solid #10b981;background:#ecfdf5;border-radius:8px;padding:8px;min-height:72px;">
        <div style="font-weight:800;color:#065f46;margin-bottom:4px;">تحویل و ثبت نهایی در واحد فارغ‌التحصیلان (خاتمه‌یافته)</div>
        <div style="font-size:10px;color:#064e3b;line-height:1.6;">
          <div>کارشناس: <b>${escapeHtml(clearance.graduationFinalizedBy || '---')}</b></div>
          <div>تاریخ خاتمه: <b>${escapeHtml(clearance.graduationFinalizedAt || '---')}</b> • شماره بایگانی: <b dir="ltr">${escapeHtml(clearance.graduationArchiveNumber || '---')}</b></div>
          ${clearance.graduationFinalNote ? `<div>توضیحات: ${escapeHtml(clearance.graduationFinalNote)}</div>` : ''}
        </div>
      </div>
    `
    : `
      <div style="border:1px solid #cbd5e1;border-radius:8px;padding:8px;min-height:72px;display:flex;flex-direction:column;justify-content:space-between;">
        <div style="font-weight:800;color:#334155;">تحویل و ثبت در اداره امور فارغ‌التحصیلان:</div>
        <div style="font-size:10px;color:#64748b;">تاریخ تحویل: ..... / ..... / 140.... • شماره پرونده: ............</div>
      </div>
    `;

  return `
    <div class="clearance-page" style="border:2px solid #1e293b;border-radius:10px;padding:16px 18px;background:#ffffff;color:#0f172a;${isLast ? '' : 'page-break-after:always;break-after:page;'}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:10px;border-bottom:2px solid #1e293b;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          ${logoHtml}
          <div>
            <div style="font-size:10.5px;font-weight:700;color:#475569;">جمهوری اسلامی ایران • وزارت آموزش و پرورش</div>
            <div style="font-size:15px;font-weight:900;color:#0f172a;margin-top:2px;">دانشگاه فرهنگیان استان اصفهان</div>
            <div style="font-size:11px;font-weight:800;color:#0f766e;margin-top:2px;">سامانه جامع خدمات دانشجویی — برگ تسویه حساب الکترونیک فراغت از تحصیل</div>
          </div>
        </div>
        <div style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:8px;padding:7px 10px;font-size:10.5px;min-width:165px;">
          <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:3px;">
            <span style="color:#64748b;font-weight:700;">کد رهگیری:</span>
            <span dir="ltr" style="font-weight:900;">${escapeHtml(clearance.trackingCode)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:3px;">
            <span style="color:#64748b;font-weight:700;">تاریخ ثبت:</span>
            <span style="font-weight:700;">${escapeHtml(clearance.requestedAt)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:8px;">
            <span style="color:#64748b;font-weight:700;">تاریخ تکمیل:</span>
            <span style="font-weight:800;color:#047857;">${escapeHtml(clearance.completedAt || 'در حال تکمیل')}</span>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:12px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;margin-bottom:10px;">
        <div style="width:82px;height:106px;border:1.5px solid #64748b;border-radius:8px;background:#fff;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${photoHtml}
        </div>
        <div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:8px 12px;font-size:11px;">
          <div><div style="color:#64748b;font-size:10px;">نام و نام خانوادگی:</div><div style="font-weight:900;font-size:12.5px;">${escapeHtml(clearance.studentName)}</div></div>
          <div><div style="color:#64748b;font-size:10px;">شماره دانشجویی:</div><div dir="ltr" style="font-weight:900;text-align:right;">${escapeHtml(clearance.studentId)}</div></div>
          <div><div style="color:#64748b;font-size:10px;">کد ملی:</div><div dir="ltr" style="font-weight:700;text-align:right;">${escapeHtml(clearance.studentNationalId || '---')}</div></div>
          <div><div style="color:#64748b;font-size:10px;">نام پدر:</div><div style="font-weight:700;">${escapeHtml(clearance.studentFatherName || '---')}</div></div>
          <div><div style="color:#64748b;font-size:10px;">رشته تحصیلی:</div><div style="font-weight:800;">${escapeHtml(clearance.studentFieldOfStudy)}</div></div>
          <div><div style="color:#64748b;font-size:10px;">ورودی:</div><div style="font-weight:700;">${escapeHtml(clearance.studentEntryTerm)}</div></div>
          <div><div style="color:#64748b;font-size:10px;">سال و نیمسال فراغت:</div><div style="font-weight:800;color:#0f766e;">${escapeHtml(clearance.graduationAcademicYear)} — ${escapeHtml(clearance.graduationSemester)}</div></div>
          <div><div style="color:#64748b;font-size:10px;">شماره تماس:</div><div dir="ltr" style="font-weight:700;text-align:right;">${escapeHtml(clearance.studentPhone || '---')}</div></div>
          <div><div style="color:#64748b;font-size:10px;">سرا / اتاق:</div><div style="font-weight:700;">${escapeHtml(clearance.dormName ? `${clearance.dormName}${clearance.roomNumber ? ` - اتاق ${clearance.roomNumber}` : ''}` : 'غیرساکن / تخلیه شده')}</div></div>
        </div>
      </div>

      <div style="padding:7px 10px;border:1px solid #99f6e4;background:#f0fdfa;border-radius:7px;display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:6px;">
        <div><b>مرحله ۱ — تاییدیه کارشناس آموزش:</b> ${clearance.educationGateStatus === 'approved' ? 'تایید شده' : 'در انتظار تایید'}</div>
        ${clearance.educationReviewerName ? `<div style="font-size:10px;font-weight:700;color:#115e59;">کارشناس آموزش: ${escapeHtml(clearance.educationReviewerName)} (${escapeHtml(clearance.educationReviewedAt || '')})</div>` : ''}
      </div>

      <div style="padding:7px 10px;border:1px solid #c7d2fe;background:#eef2ff;border-radius:7px;display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:10px;">
        <div><b>مرحله ۲ — تاییدیه مدیر گروه رشته (گزارش ۱۰۵۰ سامانه گلستان):</b> ${
          clearance.deptHeadGateStatus === 'approved' || clearance.deptHeadReport1050Verified
            ? 'تایید شده (گذراندن کامل واحدهای الزامی سرفصل)'
            : clearance.status === 'in_clearance' || clearance.status === 'completed'
            ? 'تایید شده (پرونده پیشین)'
            : clearance.deptHeadGateStatus === 'rejected'
            ? 'رد شده (نقص سرفصل)'
            : 'در انتظار تایید مدیر گروه'
        }</div>
        ${clearance.deptHeadReviewerName ? `<div style="font-size:10px;font-weight:700;color:#3730a3;">مدیر گروه: ${escapeHtml(clearance.deptHeadReviewerName)} (${escapeHtml(clearance.deptHeadReviewedAt || '')})</div>` : ''}
      </div>

      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:900;margin-bottom:5px;">
          <span>جدول تاییدیه‌های الکترونیک واحدهای دانشگاهی (${approvedCount} از ${CLEARANCE_UNITS_META.length} واحد تایید شده)</span>
          <span style="color:${isCompleted ? '#047857' : '#b45309'};">${isCompleted ? 'وضعیت نهایی: تسویه کامل تایید شده' : 'وضعیت: در حال تکمیل'}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:10.5px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="border:1px solid #94a3b8;padding:5px;width:30px;">ردیف</th>
              <th style="border:1px solid #94a3b8;padding:5px 8px;text-align:right;">نام واحد</th>
              <th style="border:1px solid #94a3b8;padding:5px;width:78px;">وضعیت</th>
              <th style="border:1px solid #94a3b8;padding:5px 8px;text-align:right;">مسئول تاییدکننده</th>
              <th style="border:1px solid #94a3b8;padding:5px;width:96px;">تاریخ بررسی</th>
              <th style="border:1px solid #94a3b8;padding:5px 8px;text-align:right;">توضیحات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div style="padding-top:10px;border-top:2px solid #1e293b;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:10.5px;">
        <div style="border:1px solid #cbd5e1;border-radius:8px;padding:8px;min-height:72px;display:flex;flex-direction:column;justify-content:space-between;">
          <div style="font-weight:800;color:#334155;">امضاء و اثر انگشت دانش‌آموخته:</div>
          <div style="font-size:9.5px;color:#64748b;">اینجانب ${escapeHtml(clearance.studentName)} صحت کلیه مندرجات فوق را تایید می‌نمایم.</div>
        </div>
        <div style="border:1px solid #cbd5e1;border-radius:8px;padding:8px;min-height:72px;display:flex;flex-direction:column;justify-content:space-between;">
          <div style="font-weight:800;color:#334155;">مهر و امضاء معاونت دانشجویی / آموزش:</div>
          <div style="font-size:9.5px;color:#64748b;">صحت تاییدیه‌های الکترونیک سامانه جامع خدمات دانشجویی تایید می‌گردد.</div>
        </div>
        ${gradBoxHtml}
      </div>

      <div style="text-align:center;font-size:9.5px;color:#64748b;margin-top:8px;">
        صادر شده از «سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان استان اصفهان» — کد رهگیری: <b dir="ltr">${escapeHtml(clearance.trackingCode)}</b>
      </div>
    </div>
  `;
}

export const GraduationDashboard: React.FC<GraduationDashboardProps> = ({
  staff,
  messages,
  settings,
  onDataChange,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClearanceFilter>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [printTarget, setPrintTarget] = useState<GraduationClearanceRequest | null>(null);

  // مودال خاتمه تکی
  const [finalizeTarget, setFinalizeTarget] = useState<GraduationClearanceRequest | null>(null);
  const [archiveNumberInput, setArchiveNumberInput] = useState('');
  const [finalNoteInput, setFinalNoteInput] = useState('');

  // مودال خاتمه یکجا
  const [showBulkFinalizeModal, setShowBulkFinalizeModal] = useState(false);
  const [bulkFinalNoteInput, setBulkFinalNoteInput] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const clearances = useMemo(() => {
    void refreshTick;
    return Storage.getGraduationClearances();
  }, [refreshTick]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5500);
  };

  const distinctFields = useMemo(() => {
    const set = new Set<string>();
    clearances.forEach((c) => {
      if (c.studentFieldOfStudy?.trim()) set.add(c.studentFieldOfStudy.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [clearances]);

  const stats = useMemo(() => {
    const total = clearances.length;
    const readyToFinalize = clearances.filter(
      (c) => c.status === 'completed' && !c.graduationFinalized
    ).length;
    const finalized = clearances.filter((c) => c.graduationFinalized).length;
    const hasRejection = clearances.filter(
      (c) =>
        c.status === 'rejected_education' ||
        CLEARANCE_UNITS_META.some((u) => c.units?.[u.role]?.status === 'rejected')
    ).length;
    const inProgress = clearances.filter(
      (c) => c.status === 'pending_education' || c.status === 'in_clearance'
    ).length;
    return { total, readyToFinalize, finalized, hasRejection, inProgress };
  }, [clearances]);

  const filteredClearances = useMemo(() => {
    const q = normalizePersianSearch(searchQuery);
    return clearances.filter((c) => {
      if (fieldFilter !== 'all' && c.studentFieldOfStudy !== fieldFilter) return false;

      if (statusFilter === 'ready_to_finalize') {
        if (!(c.status === 'completed' && !c.graduationFinalized)) return false;
      } else if (statusFilter === 'finalized') {
        if (!c.graduationFinalized) return false;
      } else if (statusFilter === 'in_progress') {
        if (!(c.status === 'pending_education' || c.status === 'in_clearance')) return false;
      } else if (statusFilter === 'has_rejection') {
        const anyRejected =
          c.status === 'rejected_education' ||
          CLEARANCE_UNITS_META.some((u) => c.units?.[u.role]?.status === 'rejected');
        if (!anyRejected) return false;
      }

      if (q) {
        const hay = normalizePersianSearch(
          [
            c.trackingCode,
            c.studentName,
            c.studentId,
            c.studentNationalId || '',
            c.studentFieldOfStudy,
            c.studentEntryTerm,
            c.graduationArchiveNumber || '',
            c.graduationAcademicYear,
          ].join(' ')
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [clearances, searchQuery, statusFilter, fieldFilter]);

  const selectedClearances = useMemo(() => {
    const idSet = new Set(selectedIds);
    return clearances.filter((c) => idSet.has(c.id));
  }, [clearances, selectedIds]);

  const selectedReadyToFinalize = useMemo(
    () => selectedClearances.filter((c) => c.status === 'completed' && !c.graduationFinalized),
    [selectedClearances]
  );

  const unreadMessagesCount = useMemo(
    () =>
      messages.filter(
        (m) =>
          (m.receiverType === 'graduation' || m.category === 'graduation') &&
          m.senderRole !== 'graduation' &&
          m.status !== 'answered'
      ).length,
    [messages]
  );

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllCompletedReady = () => {
    const readyIds = filteredClearances
      .filter((c) => c.status === 'completed' && !c.graduationFinalized)
      .map((c) => c.id);
    if (readyIds.length === 0) {
      // اگر در فیلتر فعلی نبود، همه فرم‌های تکمیل‌شده (حتی خاتمه‌یافته) را انتخاب کن
      const allCompletedIds = filteredClearances
        .filter((c) => c.status === 'completed')
        .map((c) => c.id);
      if (allCompletedIds.length === 0) {
        showToast('error', 'در فهرست فعلی هیچ فرم تسویه تکمیل‌شده‌ای وجود ندارد.');
        return;
      }
      setSelectedIds(allCompletedIds);
      showToast(
        'success',
        `${allCompletedIds.length.toLocaleString('fa-IR')} فرم تسویه تکمیل‌شده جهت دریافت/چاپ یکجا انتخاب شد.`
      );
      return;
    }
    setSelectedIds(readyIds);
    showToast(
      'success',
      `${readyIds.length.toLocaleString('fa-IR')} پرونده آماده خاتمه (تایید کامل تمام واحدها) انتخاب شد.`
    );
  };

  const selectAllCompletedIncludingFinalized = () => {
    const ids = clearances.filter((c) => c.status === 'completed').map((c) => c.id);
    if (ids.length === 0) {
      showToast('error', 'هنوز هیچ فرم تسویه‌ای تمام مراحل واحدها را تکمیل نکرده است.');
      return;
    }
    setSelectedIds(ids);
    showToast(
      'success',
      `همه ${ids.length.toLocaleString('fa-IR')} فرم تسویه تکمیل‌شده در کل سامانه انتخاب شد.`
    );
  };

  const handleBatchPrint = (targets: GraduationClearanceRequest[]) => {
    if (targets.length === 0) {
      showToast('error', 'هیچ فرم تسویه‌ای برای چاپ یکجا انتخاب نشده است.');
      return;
    }

    const pagesHtml = targets
      .map((clr, idx) => buildSingleClearancePageHtml(clr, settings, idx === targets.length - 1))
      .join('\n');

    const fullHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>چاپ یکجای فرم‌های تسویه حساب فارغ‌التحصیلان (${targets.length})</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; font-family: Vazirmatn, Tahoma, 'Segoe UI', sans-serif; }
    body { margin: 0; padding: 0; background: #ffffff; color: #0f172a; direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .clearance-page { margin: 0 auto; }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      showToast('error', 'امکان آماده‌سازی چاپ یکجا در مرورگر وجود نداشت.');
      return;
    }

    doc.open();
    doc.write(fullHtml);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1500);
      }
    }, 350);
  };

  const handleExportExcel = (targets: GraduationClearanceRequest[]) => {
    if (targets.length === 0) {
      showToast('error', 'هیچ پرونده‌ای برای خروجی اکسل موجود نیست.');
      return;
    }

    const rows = targets.map((c, index) => {
      const approvedUnitsCount = CLEARANCE_UNITS_META.filter(
        (u) => c.units?.[u.role]?.status === 'approved'
      ).length;
      const baseRow: Record<string, string | number> = {
        'ردیف': index + 1,
        'کد رهگیری': c.trackingCode,
        'شماره بایگانی فارغ‌التحصیلان': c.graduationArchiveNumber || '-',
        'نام و نام خانوادگی': c.studentName,
        'شماره دانشجویی': c.studentId,
        'کد ملی': c.studentNationalId || '-',
        'نام پدر': c.studentFatherName || '-',
        'رشته تحصیلی': c.studentFieldOfStudy,
        'ورودی': c.studentEntryTerm,
        'سال و نیمسال فراغت': `${c.graduationAcademicYear} - ${c.graduationSemester}`,
        'تلفن تماس': c.studentPhone || '-',
        'تاییدیه‌ها': `${approvedUnitsCount} از ${CLEARANCE_UNITS_META.length}`,
        'وضعیت گردش کار':
          c.graduationFinalized
            ? 'خاتمه‌یافته و بایگانی‌شده'
            : c.status === 'completed'
            ? 'تکمیل‌شده (آماده خاتمه)'
            : c.status === 'pending_education'
            ? 'در انتظار تایید آموزش'
            : c.status === 'rejected_education'
            ? 'رد شده در واحد آموزش'
            : 'در حال گردش بین واحدها',
        'تاریخ ثبت درخواست': c.requestedAt,
        'تاریخ تکمیل واحدها': c.completedAt || '-',
        'کارشناس خاتمه‌دهنده': c.graduationFinalizedBy || '-',
        'تاریخ خاتمه': c.graduationFinalizedAt || '-',
        'توضیحات نهایی فارغ‌التحصیلان': c.graduationFinalNote || '-',
      };

      CLEARANCE_UNITS_META.forEach((u) => {
        const rec = c.units?.[u.role];
        const stLabel =
          rec?.status === 'approved'
            ? `تایید (${rec.reviewerName || '-'})`
            : rec?.status === 'rejected'
            ? `رد: ${rec.note || '-'}`
            : 'در انتظار';
        baseRow[u.label] = stLabel;
      });
      return baseRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تسویه_فارغ_التحصیلان');
    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `فرم_تسویه_فارغ_التحصیلان_${dateStamp}.xlsx`);
    showToast(
      'success',
      `فایل اکسل شامل ${targets.length.toLocaleString('fa-IR')} پرونده تسویه با موفقیت دانلود شد.`
    );
  };

  const openFinalizeModal = (c: GraduationClearanceRequest) => {
    setFinalizeTarget(c);
    setArchiveNumberInput(c.graduationArchiveNumber || `GRD-${c.trackingCode.replace(/^CLR-?/i, '')}`);
    setFinalNoteInput(c.graduationFinalNote || '');
  };

  const handleConfirmSingleFinalize = () => {
    if (!finalizeTarget) return;
    const res = Storage.finalizeGraduationClearance(finalizeTarget.id, {
      staffId: staff.id,
      staffName: staff.fullName,
      archiveNumber: archiveNumberInput,
      note: finalNoteInput,
    });
    if (res.success) {
      showToast('success', res.message);
      setFinalizeTarget(null);
      setArchiveNumberInput('');
      setFinalNoteInput('');
      setRefreshTick((t) => t + 1);
      onDataChange();
    } else {
      showToast('error', res.message);
    }
  };

  const handleConfirmBulkFinalize = () => {
    const ids = selectedReadyToFinalize.map((c) => c.id);
    if (ids.length === 0) {
      showToast('error', 'هیچ پرونده آماده خاتمه‌ای در موارد انتخاب‌شده وجود ندارد.');
      return;
    }
    const res = Storage.bulkFinalizeGraduationClearances(ids, {
      staffId: staff.id,
      staffName: staff.fullName,
      note: bulkFinalNoteInput,
    });
    if (res.success) {
      showToast('success', res.message);
      setShowBulkFinalizeModal(false);
      setBulkFinalNoteInput('');
      setSelectedIds([]);
      setRefreshTick((t) => t + 1);
      onDataChange();
    } else {
      showToast('error', res.message);
    }
  };

  const handleReopenFinalization = (c: GraduationClearanceRequest) => {
    const res = Storage.reopenGraduationClearanceFinalization(c.id, {
      staffName: staff.fullName,
    });
    if (res.success) {
      showToast('success', res.message);
      setRefreshTick((t) => t + 1);
      onDataChange();
    } else {
      showToast('error', res.message);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* سربرگ کارتابل واحد فارغ‌التحصیلان */}
      <div className="rounded-3xl bg-gradient-to-l from-indigo-900 via-blue-900 to-teal-900 text-white p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <GraduationCap className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  اداره امور فارغ‌التحصیلان
                </span>
                <span className="text-xs text-blue-100/80">
                  {staff.department || 'واحد فارغ‌التحصیلان دانشگاه فرهنگیان اصفهان'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-1">
                خوش آمدید، {staff.fullName}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl">
                مشاهده لحظه‌ای گردش کار تسویه حساب دانشجویان، دریافت و چاپ تکی یا یکجای برگه‌های تسویه تکمیل‌شده و خاتمه رسمی پرونده فراغت از تحصیل.
              </p>
            </div>
          </div>

          {/* دکمه‌های پیام‌ها و راهنما */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenMessages}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-200" />
              <span>پیام‌ها و مکاتبات</span>
              {unreadMessagesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {unreadMessagesCount.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onOpenUserGuide('graduation')}
              className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              <span>راهنمای کاربری</span>
            </button>
          </div>
        </div>
      </div>

      {/* اعلان وضعیت عملیات */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-5">
          {/* کارت‌های آمار سریع */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-2xl border text-right transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold opacity-75">کل پرونده‌های تسویه</div>
              <div className="text-2xl font-black mt-1">{stats.total.toLocaleString('fa-IR')}</div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ready_to_finalize')}
              className={`p-4 rounded-2xl border text-right transition cursor-pointer ${
                statusFilter === 'ready_to_finalize'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 hover:border-emerald-400'
              }`}
            >
              <div className="text-xs font-bold opacity-85">آماده دریافت و خاتمه (تایید کامل)</div>
              <div className="text-2xl font-black mt-1">{stats.readyToFinalize.toLocaleString('fa-IR')}</div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('finalized')}
              className={`p-4 rounded-2xl border text-right transition cursor-pointer ${
                statusFilter === 'finalized'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 hover:border-indigo-400'
              }`}
            >
              <div className="text-xs font-bold opacity-85">خاتمه‌یافته و بایگانی‌شده</div>
              <div className="text-2xl font-black mt-1">{stats.finalized.toLocaleString('fa-IR')}</div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`p-4 rounded-2xl border text-right transition cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:border-amber-400'
              }`}
            >
              <div className="text-xs font-bold opacity-85">در حال گردش در واحدها</div>
              <div className="text-2xl font-black mt-1">{stats.inProgress.toLocaleString('fa-IR')}</div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('has_rejection')}
              className={`p-4 rounded-2xl border text-right transition cursor-pointer col-span-2 lg:col-span-1 ${
                statusFilter === 'has_rejection'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 hover:border-rose-400'
              }`}
            >
              <div className="text-xs font-bold opacity-85">دارای نقص / رد شده</div>
              <div className="text-2xl font-black mt-1">{stats.hasRejection.toLocaleString('fa-IR')}</div>
            </button>
          </div>

          {/* نوار ابزار دریافت یکجا، جستجو و فیلتر */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس نام دانشجو، شماره دانشجویی، کد ملی، کد رهگیری، شماره بایگانی یا رشته..."
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={fieldFilter}
                    onChange={(e) => setFieldFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="all">همه رشته‌های تحصیلی</option>
                    {distinctFields.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={selectAllCompletedReady}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>انتخاب آماده خاتمه‌ها ({stats.readyToFinalize.toLocaleString('fa-IR')})</span>
                </button>

                <button
                  type="button"
                  onClick={selectAllCompletedIncludingFinalized}
                  className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>انتخاب کل تکمیل‌شده‌ها</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleExportExcel(
                      selectedClearances.length > 0
                        ? selectedClearances
                        : filteredClearances.filter((c) => c.status === 'completed')
                    )
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="خروجی اکسل از موارد انتخاب‌شده یا همه فرم‌های تکمیل‌شده"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>اکسل یکجا</span>
                </button>
              </div>
            </div>

            {/* نوار عملیات دسته‌جمعی روی موارد انتخاب‌شده */}
            {selectedIds.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-indigo-950 dark:text-indigo-100">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {selectedIds.length.toLocaleString('fa-IR')} پرونده انتخاب شده است
                    {selectedReadyToFinalize.length > 0 && (
                      <span className="text-emerald-700 dark:text-emerald-300 mr-1.5">
                        ({selectedReadyToFinalize.length.toLocaleString('fa-IR')} مورد آماده خاتمه)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBatchPrint(selectedClearances)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>دریافت و چاپ یکجا ({selectedClearances.length.toLocaleString('fa-IR')} برگه A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportExcel(selectedClearances)}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>خروجی اکسل انتخاب‌شده‌ها</span>
                  </button>

                  {selectedReadyToFinalize.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBulkFinalizeModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Stamp className="w-4 h-4" />
                      <span>خاتمه یکجای فرآیند ({selectedReadyToFinalize.length.toLocaleString('fa-IR')} مورد)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    لغو انتخاب
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* فهرست پرونده‌های تسویه حساب و گردش کار */}
          {filteredClearances.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <FileCheck2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm">
                پرونده تسویه حسابی با فیلترهای انتخاب‌شده یافت نشد
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                به محض ثبت درخواست تسویه توسط دانشجویان و گردش در واحدها، وضعیت کامل پرونده‌ها در این کارتابل نمایش داده می‌شود.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClearances.map((c) => {
                const approvedCount = CLEARANCE_UNITS_META.filter(
                  (u) => c.units?.[u.role]?.status === 'approved'
                ).length;
                const rejectedUnits = CLEARANCE_UNITS_META.filter(
                  (u) => c.units?.[u.role]?.status === 'rejected'
                );
                const progressPct = Math.round((approvedCount / CLEARANCE_UNITS_META.length) * 100);
                const isCompleted = c.status === 'completed';
                const isFinalized = Boolean(c.graduationFinalized);
                const isSelected = selectedIds.includes(c.id);
                const isExpanded = expandedId === c.id;

                return (
                  <div
                    key={c.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition shadow-sm overflow-hidden ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : isFinalized
                        ? 'border-indigo-200 dark:border-indigo-900/60'
                        : isCompleted
                        ? 'border-emerald-300 dark:border-emerald-800'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* بخش انتخاب + عکس + مشخصات دانشجو */}
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSelectId(c.id)}
                          className="mt-1 p-1 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer shrink-0"
                          title="انتخاب برای عملیات یکجا"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        <div className="w-12 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                          {c.studentPhotoUrl ? (
                            <img
                              src={c.studentPhotoUrl}
                              alt={c.studentName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-slate-400" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {c.studentName}
                            </span>
                            <span
                              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              dir="ltr"
                            >
                              {c.studentId}
                            </span>
                            <span
                              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                              dir="ltr"
                            >
                              {c.trackingCode}
                            </span>

                            {isFinalized ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
                                <Archive className="w-3 h-3" />
                                خاتمه‌یافته ({c.graduationArchiveNumber || 'بایگانی'})
                              </span>
                            ) : isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                تکمیل‌شده — آماده دریافت و خاتمه
                              </span>
                            ) : c.status === 'rejected_education' || rejectedUnits.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                                <XCircle className="w-3 h-3" />
                                دارای نقص ({c.status === 'rejected_education' ? 'واحد آموزش' : `${rejectedUnits.length} واحد`})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3 h-3" />
                                {c.status === 'pending_education' ? 'در انتظار تایید آموزش' : 'در حال گردش در واحدها'}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <span>رشته: <b className="text-slate-800 dark:text-slate-200">{c.studentFieldOfStudy}</b></span>
                            <span>ورودی: <b>{c.studentEntryTerm}</b></span>
                            <span>فراغت: <b>{c.graduationAcademicYear} — {c.graduationSemester}</b></span>
                            <span>ثبت: {c.requestedAt}</span>
                          </div>

                          {/* نوار پیشرفت واحدها */}
                          <div className="flex items-center gap-2.5 pt-1 max-w-md">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isFinalized
                                    ? 'bg-indigo-600'
                                    : isCompleted
                                    ? 'bg-emerald-500'
                                    : rejectedUnits.length > 0
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 shrink-0">
                              {approvedCount.toLocaleString('fa-IR')} / {CLEARANCE_UNITS_META.length.toLocaleString('fa-IR')} واحد ({progressPct.toLocaleString('fa-IR')}٪)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* دکمه‌های عملیات هر پرونده */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : c.id)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span>گردش کار</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPrintTarget(c)}
                          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>دریافت و چاپ برگه</span>
                        </button>

                        {isCompleted && !isFinalized && (
                          <button
                            type="button"
                            onClick={() => openFinalizeModal(c)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                          >
                            <Stamp className="w-4 h-4" />
                            <span>خاتمه فرآیند تسویه</span>
                          </button>
                        )}

                        {isFinalized && (
                          <button
                            type="button"
                            onClick={() => handleReopenFinalization(c)}
                            className="px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            title="بازگرداندن پرونده از حالت خاتمه‌یافته به آماده خاتمه"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>بازگشایی</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* بخش جزئیات کامل گردش کار تسویه */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-4">
                        {/* وضعیت گیت کارشناس آموزش، مدیر گروه (گزارش ۱۰۵۰) و وضعیت خاتمه فارغ‌التحصیلان */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/30 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-extrabold text-teal-900 dark:text-teal-200">
                              <ShieldCheck className="w-4 h-4" />
                              <span>مرحله ۱ — تاییدیه کارشناس آموزش</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300">
                              وضعیت:{' '}
                              <b>
                                {c.educationGateStatus === 'approved'
                                  ? 'تایید و ارجاع به مدیر گروه'
                                  : c.educationGateStatus === 'rejected'
                                  ? 'رد شده (نقص آموزشی)'
                                  : 'در انتظار بررسی کارشناس آموزش'}
                              </b>
                            </p>
                            {c.educationReviewerName && (
                              <p className="text-slate-600 dark:text-slate-400">
                                کارشناس: {c.educationReviewerName} ({c.educationReviewedAt})
                              </p>
                            )}
                            {c.educationNote && (
                              <p className="text-slate-600 dark:text-slate-400">توضیحات: {c.educationNote}</p>
                            )}
                          </div>

                          <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-extrabold text-indigo-900 dark:text-indigo-200">
                              <ShieldCheck className="w-4 h-4" />
                              <span>مرحله ۲ — مدیر گروه (گزارش ۱۰۵۰ گلستان)</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300">
                              وضعیت:{' '}
                              <b>
                                {c.deptHeadGateStatus === 'approved' || c.deptHeadReport1050Verified
                                  ? 'تایید گذراندن کلیه واحدهای الزامی سرفصل'
                                  : c.status === 'in_clearance' || c.status === 'completed'
                                  ? 'تایید شده (پرونده پیشین)'
                                  : c.deptHeadGateStatus === 'rejected'
                                  ? 'رد شده (نقص سرفصل / گزارش ۱۰۵۰)'
                                  : 'در انتظار تایید مدیر گروه رشته'}
                              </b>
                            </p>
                            {c.deptHeadReviewerName && (
                              <p className="text-slate-600 dark:text-slate-400">
                                مدیر گروه: {c.deptHeadReviewerName} ({c.deptHeadReviewedAt})
                              </p>
                            )}
                            {c.deptHeadNote && (
                              <p className="text-slate-600 dark:text-slate-400">توضیحات: {c.deptHeadNote}</p>
                            )}
                          </div>

                          <div
                            className={`p-3 rounded-xl border text-xs space-y-1 ${
                              isFinalized
                                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-extrabold text-indigo-900 dark:text-indigo-200">
                              <Stamp className="w-4 h-4" />
                              <span>مرحله نهایی — دریافت و خاتمه در واحد فارغ‌التحصیلان</span>
                            </div>
                            {isFinalized ? (
                              <>
                                <p className="text-indigo-800 dark:text-indigo-200 font-bold">
                                  خاتمه‌یافته توسط {c.graduationFinalizedBy} در {c.graduationFinalizedAt}
                                </p>
                                <p className="text-slate-700 dark:text-slate-300">
                                  شماره پرونده / بایگانی:{' '}
                                  <span className="font-mono font-black" dir="ltr">
                                    {c.graduationArchiveNumber || '---'}
                                  </span>
                                </p>
                                {c.graduationFinalNote && (
                                  <p className="text-slate-600 dark:text-slate-400">
                                    توضیحات: {c.graduationFinalNote}
                                  </p>
                                )}
                              </>
                            ) : isCompleted ? (
                              <p className="text-emerald-700 dark:text-emerald-300 font-bold">
                                کلیه ۱۲ واحد تسویه را تایید کرده‌اند ({c.completedAt}). آماده دریافت برگه و خاتمه فرآیند.
                              </p>
                            ) : (
                              <p className="text-slate-500 dark:text-slate-400">
                                تا زمان تایید همه ۱۲ واحد تسویه، امکان خاتمه نهایی پرونده فعال نمی‌شود.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* شبکه وضعیت تک‌تک ۱۲ واحد تسویه */}
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-2">
                            جزئیات گردش کار در ۱۲ واحد دانشگاهی:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {CLEARANCE_UNITS_META.map((u, idx) => {
                              const rec = c.units?.[u.role];
                              const st = rec?.status || 'pending';
                              return (
                                <div
                                  key={u.role}
                                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                                    st === 'approved'
                                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70'
                                      : st === 'rejected'
                                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/70'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-extrabold text-slate-900 dark:text-white">
                                      {(idx + 1).toLocaleString('fa-IR')}. {u.label}
                                    </span>
                                    {st === 'approved' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        تایید
                                      </span>
                                    ) : st === 'rejected' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 dark:text-rose-300">
                                        <XCircle className="w-3.5 h-3.5" />
                                        رد شده
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                        <Clock className="w-3.5 h-3.5" />
                                        در انتظار
                                      </span>
                                    )}
                                  </div>
                                  {rec?.reviewerName && (
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                      مسئول: <b>{rec.reviewerName}</b> — {rec.reviewedAt}
                                    </div>
                                  )}
                                  {rec?.note && (
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                      {rec.note}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* مودال چاپ تکی برگه تسویه */}
      {printTarget && (
        <GraduationClearancePrintModal
          isOpen={true}
          onClose={() => setPrintTarget(null)}
          clearance={printTarget}
          settings={settings}
        />
      )}

      {/* مودال خاتمه تکی فرآیند تسویه */}
      {finalizeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-sm">
                <Stamp className="w-5 h-5" />
                <span>خاتمه نهایی فرآیند تسویه حساب</span>
              </div>
              <button
                type="button"
                onClick={() => setFinalizeTarget(null)}
                className="p-1.5 rounded-lg hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {finalizeTarget.studentName}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  شماره دانشجویی: <b dir="ltr">{finalizeTarget.studentId}</b> • کد رهگیری:{' '}
                  <b dir="ltr">{finalizeTarget.trackingCode}</b>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  رشته: <b>{finalizeTarget.studentFieldOfStudy}</b>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  شماره پرونده / بایگانی فارغ‌التحصیلان:
                </label>
                <input
                  type="text"
                  value={archiveNumberInput}
                  onChange={(e) => setArchiveNumberInput(e.target.value)}
                  placeholder="مثلاً GRD-101"
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  توضیحات ثبت و خاتمه (اختیاری):
                </label>
                <textarea
                  rows={3}
                  value={finalNoteInput}
                  onChange={(e) => setFinalNoteInput(e.target.value)}
                  placeholder="مثلاً برگه تسویه دریافت و در پرونده دانش‌آموخته بایگانی شد..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFinalizeTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSingleFinalize}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تایید و خاتمه فرآیند</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال خاتمه یکجای فرآیند تسویه */}
      {showBulkFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-extrabold text-sm">
                <Layers className="w-5 h-5" />
                <span>خاتمه یکجای پرونده‌های تسویه تکمیل‌شده</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkFinalizeModal(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                تعداد{' '}
                <b className="text-emerald-700 dark:text-emerald-300">
                  {selectedReadyToFinalize.length.toLocaleString('fa-IR')} پرونده
                </b>{' '}
                که تایید تمامی ۱۲ واحد تسویه را دریافت کرده‌اند به‌صورت یکجا خاتمه و بایگانی شده و پیام تایید نهایی برای دانشجویان ارسال می‌شود.
              </p>

              <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                {selectedReadyToFinalize.map((c) => (
                  <div key={c.id} className="px-3 py-2 flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{c.studentName}</span>
                    <span className="font-mono text-[11px] text-slate-500" dir="ltr">
                      {c.trackingCode}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  توضیحات مشترک خاتمه (اختیاری):
                </label>
                <textarea
                  rows={2}
                  value={bulkFinalNoteInput}
                  onChange={(e) => setBulkFinalNoteInput(e.target.value)}
                  placeholder="مثلاً دریافت یکجا و بایگانی پرونده‌های فراغت از تحصیل نیمسال جاری..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkFinalizeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkFinalize}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Stamp className="w-4 h-4" />
                  <span>خاتمه یکجای {selectedReadyToFinalize.length.toLocaleString('fa-IR')} پرونده</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
