import React, { useState, useMemo } from 'react';
import { Dormitory, Room, Bed, Student } from '../types';
import { Storage } from '../utils/storage';
import { exportVacantBedsToExcel, exportStudentsToExcel, exportDomainReportToExcel, toEnglishDigits } from '../utils/excelUtils';
import {
  BarChart3,
  Download,
  Printer,
  Users,
  Bed as BedIcon,
  MapPin,
  HeartPulse,
  Filter,
  GraduationCap,
  Building,
  CheckCircle2,
  X,
  Wrench,
  Package,
  Calendar,
  Clock,
  AlertCircle,
  ShieldAlert,
  Search,
  RotateCcw,
  FileSpreadsheet,
  Layers,
  DollarSign,
  TrendingUp,
  HelpCircle,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';

interface ReportsViewProps {
  isOpen: boolean;
  onClose: () => void;
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  isOpen,
  onClose,
  dorms,
  rooms,
  beds,
  students,
}) => {
  const [tab, setTab] = useState<'vacant' | 'provinces' | 'majors' | 'health' | 'domains'>('domains');
  const [selectedDormFilter, setSelectedDormFilter] = useState<string>('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | 'lower' | 'upper'>('all');

  // متغیرهای فیلتر گزارش ارجاعی و عملکرد حوزه‌ها
  const [domainFilter, setDomainFilter] = useState<
    'all' | 'maintenance' | 'services_cleaning' | 'warehouse' | 'accommodation' | 'rights_violation' | 'social_personal' | 'discipline'
  >('all');
  const [domainDormFilter, setDomainDormFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'resolved' | 'in_progress' | 'pending' | 'waiting_parts'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const dormsMap = useMemo(() => new Map(dorms.map((d) => [d.id, d.name])), [dorms]);
  const roomsMap = useMemo(() => new Map(rooms.map((r) => [r.id, `اتاق ${r.roomNumber}`])), [rooms]);

  // تهیه لیست تخت‌های خالی
  const vacantBedsList = beds
    .filter((b) => !b.studentId)
    .filter((b) => (selectedDormFilter === 'all' ? true : b.dormId === selectedDormFilter))
    .filter((b) => (selectedTierFilter === 'all' ? true : b.tier === selectedTierFilter))
    .map((b) => {
      const r = rooms.find((room) => room.id === b.roomId);
      const d = dorms.find((dorm) => dorm.id === b.dormId);
      return {
        bedId: b.id,
        bedLabel: b.label,
        tier: b.tier,
        bunkNumber: b.bunkNumber,
        roomNumber: r?.roomNumber || '-',
        floor: r?.floor ?? 1,
        roomCapacity: r?.capacity || 4,
        dormName: d?.name || '-',
        campus: d?.campus || '-',
        allowedFields: r?.allowedFields?.join('، ') || 'آزاد برای همه',
      };
    });

  // آمار استانی دانشجویان
  const provinceCounts: Record<string, number> = {};
  students.forEach((s) => {
    const prov = s.province || 'نامشخص';
    provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
  });
  const sortedProvinces = Object.entries(provinceCounts).sort((a, b) => b[1] - a[1]);

  // آمار رشته‌ها
  const majorCounts: Record<string, number> = {};
  students.forEach((s) => {
    const maj = s.fieldOfStudy || 'سایر';
    majorCounts[maj] = (majorCounts[maj] || 0) + 1;
  });
  const sortedMajors = Object.entries(majorCounts).sort((a, b) => b[1] - a[1]);

  // استخراج فیلدهای سلامت و گروه‌های خونی
  const bloodGroups: Record<string, number> = {};
  const specialConditions: { name: string; condition: string; dorm: string; room: string; phone: string }[] = [];

  students.forEach((s) => {
    const custom = s.customFields || {};
    const bg = String(custom['گروه خونی'] || 'ثبت نشده').trim();
    if (bg && bg !== 'ثبت نشده') {
      bloodGroups[bg] = (bloodGroups[bg] || 0) + 1;
    }

    const illness = String(custom['بیماری خاص'] || '').trim();
    if (illness && illness !== 'ندارد' && illness !== '-' && illness !== 'خیر') {
      const dormName = s.assignedDormId ? dormsMap.get(s.assignedDormId) || 'خوابگاه' : 'فاقد خوابگاه';
      const roomNum = s.assignedRoomId ? roomsMap.get(s.assignedRoomId) || '-' : '-';
      specialConditions.push({
        name: s.fullName,
        condition: illness,
        dorm: dormName,
        room: roomNum,
        phone: s.mobile,
      });
    }
  });

  const handleExportVacant = () => {
    exportVacantBedsToExcel(vacantBedsList);
  };

  const handleExportAllStudents = () => {
    exportStudentsToExcel(students, dormsMap, roomsMap);
  };

  const handlePrint = () => {
    window.print();
  };

  // بارگذاری داده‌های زنده حوزه‌ها
  const maintenanceTasks = useMemo(() => Storage.getMaintenanceTasks(), [isOpen, tab]);
  const warehouseRequests = useMemo(() => Storage.getWarehouseRequests(), [isOpen, tab]);
  const messagesList = useMemo(() => Storage.getMessages(), [isOpen, tab]);

  // ساختار منسجم کارهای ارجاعی به تمامی حوزه‌ها
  interface UnifiedWorkItem {
    id: string;
    trackingCode: string;
    domain: 'maintenance' | 'services_cleaning' | 'warehouse' | 'accommodation' | 'rights_violation' | 'social_personal' | 'discipline' | 'other';
    domainName: string;
    domainBadgeColor: string;
    title: string;
    description: string;
    dormId?: string;
    dormName: string;
    location: string;
    requester: string;
    assignee: string;
    createdDate: string;
    resolvedDate?: string;
    status: 'resolved' | 'in_progress' | 'pending' | 'waiting_parts' | 'rejected';
    statusLabel: string;
    statusBadgeColor: string;
    cost: number;
    notes?: string;
  }

  const allWorkItems: UnifiedWorkItem[] = useMemo(() => {
    const list: UnifiedWorkItem[] = [];

    // ۱. کارهای تأسیسات و تعمیرات
    maintenanceTasks.forEach((t) => {
      const dormName = dormsMap.get(t.dormId) || t.dormName || 'سرا';
      const catPersianMap: Record<string, string> = {
        electrical: 'برق و روشنایی',
        plumbing: 'تأسیسات آب و لوله‌کشی',
        heating_cooling: 'سرمایش و گرمایش',
        carpentry: 'درب، پنجره و کمد',
        masonry: 'ابنیه و ساختمانی',
        electronics: 'تجهیزات الکترونیکی',
        other: 'سایر تأسیساتی',
      };

      let st: UnifiedWorkItem['status'] = 'pending';
      let stLabel = 'در انتظار بررسی و ارجاع';
      let stColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';

      if (t.status === 'resolved') {
        st = 'resolved';
        stLabel = 'انجام و رفع نقص شده';
        stColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
      } else if (t.status === 'in_progress') {
        st = 'in_progress';
        stLabel = 'در حال انجام توسط تکنسین';
        stColor = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300';
      } else if (t.status === 'waiting_parts') {
        st = 'waiting_parts';
        stLabel = 'در انتظار تحویل قطعه از انبار';
        stColor = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300';
      } else if (t.status === 'assigned') {
        st = 'in_progress';
        stLabel = 'ارجاع به تکنسین';
        stColor = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300';
      }

      const catName = t.category ? (catPersianMap[t.category] || t.category) : 'عمومی';

      list.push({
        id: t.id,
        trackingCode: t.trackingCode || t.id,
        domain: 'maintenance',
        domainName: `تأسیسات (${catName})`,
        domainBadgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
        title: t.title,
        description: t.description,
        dormId: t.dormId,
        dormName,
        location: `اتاق ${t.roomNumber || '-'} ${t.locationDetails ? `(${t.locationDetails})` : ''}`,
        requester: `${t.createdByName} (${t.createdByRole === 'supervisor' ? 'سرپرست' : 'مدیر'})`,
        assignee: t.assignedToStaffName || 'تکنسین نامشخص',
        createdDate: t.createdAt,
        resolvedDate: t.resolvedAt,
        status: st,
        statusLabel: stLabel,
        statusBadgeColor: stColor,
        cost: t.cost || 0,
        notes: [t.technicianNotes, t.partsUsed ? `قطعات: ${t.partsUsed}` : ''].filter(Boolean).join(' | '),
      });
    });

    // ۲. درخواست‌ها و حواله‌های انبار و اقلام مصرفی
    warehouseRequests.forEach((w) => {
      const dormName = dormsMap.get(w.dormId) || w.dormName || 'سرا';
      let st: UnifiedWorkItem['status'] = 'pending';
      let stLabel = 'در انتظار بررسی سرپرست';
      let stColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';

      if (w.status === 'issued') {
        st = 'resolved';
        stLabel = 'کالا صادر و کسر شد';
        stColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
      } else if (w.status === 'pending_warehouse') {
        st = 'in_progress';
        stLabel = 'تأیید سرپرست / منتظر تحویل انبار';
        stColor = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300';
      } else if (w.status === 'rejected') {
        st = 'rejected';
        stLabel = 'رد شده توسط سرپرست';
        stColor = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300';
      }

      list.push({
        id: w.id,
        trackingCode: w.requestCode,
        domain: 'warehouse',
        domainName: 'انبار و تجهیزات مصرفی',
        domainBadgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900',
        title: `حواله: ${w.itemTitle} (${w.quantityRequested} ${w.unit})`,
        description: w.reason,
        dormId: w.dormId,
        dormName,
        location: dormName || 'انبار مرکزی سراها',
        requester: `${w.requestedByStaffName} (${w.requestedByRole === 'maintenance' ? 'تأسیسات' : 'سرپرست'})`,
        assignee: w.issuedByStaffName || 'مسئول انبار',
        createdDate: w.requestDate,
        resolvedDate: w.issuedAt,
        status: st,
        statusLabel: stLabel,
        statusBadgeColor: stColor,
        cost: w.totalCost || 0,
        notes: [w.supervisorNotes ? `نظر سرپرست: ${w.supervisorNotes}` : '', w.unitPrice ? `قیمت واحد: ${w.unitPrice.toLocaleString('fa-IR')} ریال` : ''].filter(Boolean).join(' | '),
      });
    });


    // ۳. پیام‌ها و تیکت‌های دانشجویی در حوزه‌های خدمات، حقوق دیگران، آسیب‌ها، اسکان، انضباطی
    messagesList.forEach((m) => {
      let domain: UnifiedWorkItem['domain'] = 'other';
      let domainName = 'سایر موضوعات';
      let badgeColor = 'bg-slate-100 text-slate-800 border border-slate-200';

      if (m.category === 'services_cleaning') {
        domain = 'services_cleaning';
        domainName = 'خدمات، نظافت و بهداشت سرا';
        badgeColor = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-900';
      } else if (m.category === 'rights_violation') {
        domain = 'rights_violation';
        domainName = 'عدم رعایت حقوق دیگران / مزاحمت';
        badgeColor = 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-900';
      } else if (m.category === 'social_personal') {
        domain = 'social_personal';
        domainName = 'مشاوره و آسیب‌های فردی/اجتماعی';
        badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900';
      } else if (m.category === 'accommodation') {
        domain = 'accommodation';
        domainName = 'امور اسکان و تخصیص اتاق';
        badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900';
      } else if (m.category === 'discipline') {
        domain = 'discipline';
        domainName = 'امور انضباطی سرا';
        badgeColor = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900';
      } else if (m.category === 'maintenance') {
        domain = 'maintenance';
        domainName = 'گزارش خرابی دانشجویی';
        badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900';
      }

      const isResolved = m.status === 'answered';
      const st: UnifiedWorkItem['status'] = isResolved ? 'resolved' : 'pending';
      const stLabel = isResolved ? 'رسیدگی و پاسخ داده شده' : 'در دست بررسی سرپرستی';
      const stColor = isResolved
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';

      list.push({
        id: m.id,
        trackingCode: (m.id || '').replace('msg_', '#').slice(0, 10),
        domain,
        domainName: m.isConfidential ? `🔒 ${domainName} (محرمانه)` : domainName,
        domainBadgeColor: badgeColor,
        title: m.subject || 'بدون عنوان',
        description: m.content || '',
        dormName: 'سراهای دانشجویی',
        location: m.isConfidential ? 'محرمانه (محفوظ)' : 'عمومی سرا',
        requester: m.isConfidential ? 'دانشجو (🔒 هویت محرمانه)' : (m.senderName || 'کاربر'),
        assignee: isResolved ? 'سرپرستی و کارشناسان سرا' : 'در صف رسیدگی',
        createdDate: m.date || '',
        resolvedDate: isResolved && m.replies && m.replies.length > 0 ? m.replies[m.replies.length - 1].date : undefined,
        status: st,
        statusLabel: stLabel,
        statusBadgeColor: stColor,
        cost: 0,
        notes: m.replies ? m.replies.map((r) => `${r.senderName}: ${r.content}`).join(' | ') : '',
      });
    });

    return list;
  }, [maintenanceTasks, warehouseRequests, messagesList, dormsMap]);

  // فیلتر کردن موارد
  const filteredWorkItems = useMemo(() => {
    const cleanStart = toEnglishDigits(startDate.trim());
    const cleanEnd = toEnglishDigits(endDate.trim());
    return allWorkItems.filter((item) => {
      // فیلتر حوزه
      if (domainFilter !== 'all' && item.domain !== domainFilter) {
        return false;
      }
      // فیلتر سرا
      if (domainDormFilter !== 'all' && item.dormId && item.dormId !== domainDormFilter) {
        return false;
      }
      // فیلتر بازه زمانی شروع
      if (cleanStart && item.createdDate) {
        const cDate = toEnglishDigits(item.createdDate).slice(0, 10);
        if (cDate < cleanStart) return false;
      }
      // فیلتر بازه زمانی پایان
      if (cleanEnd && item.createdDate) {
        const cDate = toEnglishDigits(item.createdDate).slice(0, 10);
        if (cDate > cleanEnd) return false;
      }
      // فیلتر وضعیت اقدام
      if (statusFilter !== 'all') {
        if (statusFilter === 'resolved' && item.status !== 'resolved') return false;
        if (statusFilter === 'in_progress' && item.status !== 'in_progress') return false;
        if (statusFilter === 'waiting_parts' && item.status !== 'waiting_parts') return false;
        if (statusFilter === 'pending' && item.status !== 'pending') return false;
      }
      // فیلتر متن جستجو
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullText = `${item.trackingCode || ''} ${item.title || ''} ${item.description || ''} ${item.requester || ''} ${item.assignee || ''} ${item.location || ''}`.toLowerCase();
        if (!fullText.includes(q)) return false;
      }
      return true;
    });
  }, [allWorkItems, domainFilter, domainDormFilter, startDate, endDate, statusFilter, searchQuery]);

  // شاخص‌های کلیدی عملکرد (KPIs)
  const totalReferredCount = filteredWorkItems.length;
  const resolvedCount = filteredWorkItems.filter((i) => i.status === 'resolved').length;
  const inProgressCount = filteredWorkItems.filter((i) => i.status === 'in_progress' || i.status === 'waiting_parts').length;
  const pendingCount = filteredWorkItems.filter((i) => i.status === 'pending').length;
  const completionRate = totalReferredCount > 0 ? Math.round((resolvedCount / totalReferredCount) * 100) : 0;
  const totalRealizedCost = filteredWorkItems.reduce((acc, i) => acc + (i.cost || 0), 0);

  // دکمه‌های سریع بازه زمانی
  const handleApplyPreset = (preset: 'all' | 'last7' | 'last30' | 'term') => {
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'last7') {
      setStartDate('1403/07/08');
      setEndDate('1403/07/15');
    } else if (preset === 'last30') {
      setStartDate('1403/07/01');
      setEndDate('1403/07/30');
    } else if (preset === 'term') {
      setStartDate('1403/06/15');
      setEndDate('1403/11/30');
    }
  };

  // دانلود اکسل حوزه و بازه زمانی انتخابی
  const handleExportDomainReport = () => {
    const domainNames: Record<string, string> = {
      all: 'همه حوزه‌ها',
      maintenance: 'تأسیسات و تعمیرات',
      services_cleaning: 'خدمات و نظافت',
      warehouse: 'انبار و تجهیزات مصرفی',
      accommodation: 'امور اسکان',
      rights_violation: 'رعایت حقوق دیگران',
      social_personal: 'مشاوره و آسیب‌های فردی/اجتماعی',
      discipline: 'امور انضباطی',
    };
    const domainName = domainNames[domainFilter] || domainFilter;
    const dateRangeStr = startDate || endDate ? `از ${startDate || 'ابتدا'} تا ${endDate || 'اکنون'}` : 'کل دوره';
    exportDomainReportToExcel(filteredWorkItems, domainName, dateRangeStr);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-6xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[92vh] flex flex-col">

        {/* سربرگ گزارش‌ها */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                سامانه جامع گزارش‌گیری، پایش عملکرد حوزه‌ها و آمار سراها
              </h3>
              <p className="text-xs text-slate-500">
                گزارش عملکرد حوزه‌ها (تأسیسات، انبار، خدمات، حقوق دیگران، آسیب‌ها، اسکان) در بازه زمانی دلخواه و آمار کلی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="چاپ گزارش"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* تب‌ها */}
        <div className="flex flex-wrap gap-2 py-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setTab('domains')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'domains'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-300" />
            <span>گزارش ارجاعی و عملکرد حوزه‌ها (بازه زمانی دلخواه)</span>
          </button>

          <button
            onClick={() => setTab('vacant')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'vacant'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <BedIcon className="w-3.5 h-3.5" />
            <span>گزارش اتاق‌ها و تخت‌های خالی ({vacantBedsList.length})</span>
          </button>

          <button
            onClick={() => setTab('provinces')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'provinces'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>توزیع استانی و شهری</span>
          </button>

          <button
            onClick={() => setTab('majors')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'majors'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>آمار بر اساس رشته تحصیلی</span>
          </button>

          <button
            onClick={() => setTab('health')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'health'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            <span>پرونده سلامت و بیماری‌های خاص</span>
          </button>
        </div>


        {/* محتوای تب‌ها */}
        <div className="flex-1 overflow-y-auto py-4">

          {/* تب جامع گزارش ارجاعی و عملکرد حوزه‌ها در بازه زمانی دلخواه */}
          {tab === 'domains' && (
            <div className="space-y-5">
              {/* بخش فیلترهای پیشرفته و بازه زمانی */}
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                      تنظیمات حوزه ارجاعی، مکان و بازه زمانی دلخواه
                    </span>
                  </div>

                  {/* کلیدهای سریع انتخاب دوره زمانی */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px]">انتخاب سریع:</span>
                    <button
                      onClick={() => handleApplyPreset('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        !startDate && !endDate
                          ? 'bg-teal-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      کل دوره
                    </button>
                    <button
                      onClick={() => handleApplyPreset('last7')}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      ۷ روز گذشته
                    </button>
                    <button
                      onClick={() => handleApplyPreset('last30')}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      ۳۰ روز گذشته
                    </button>
                    <button
                      onClick={() => handleApplyPreset('term')}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      نیمسال جاری (مهر)
                    </button>
                  </div>
                </div>

                {/* ردیف گزینه‌های فیلتر */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {/* حوزه ارجاعی */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      حوزه و دپارتمان ارجاعی:
                    </label>
                    <select
                      value={domainFilter}
                      onChange={(e) => setDomainFilter(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="all">🌐 همه حوزه‌ها و دپارتمان‌ها</option>
                      <option value="maintenance">🔧 تأسیسات و تعمیرات سرا</option>
                      <option value="services_cleaning">🧹 خدمات، نظافت و بهداشت سرا</option>
                      <option value="warehouse">📦 انبار، اقلام مصرفی و کارپردازی</option>
                      <option value="accommodation">🏠 امور اسکان و انتخاب اتاق</option>
                      <option value="rights_violation">⚖️ عدم رعایت حقوق دیگران / مزاحمت</option>
                      <option value="social_personal">🤝 آسیب‌های فردی، اجتماعی و مشاوره</option>
                      <option value="discipline">📋 امور انضباطی و تذکرات سرا</option>
                    </select>
                  </div>

                  {/* سرا / خوابگاه */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      تفکیک سرا (خوابگاه):
                    </label>
                    <select
                      value={domainDormFilter}
                      onChange={(e) => setDomainDormFilter(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="all">🏢 تمام سراهای دانشجویی</option>
                      {dorms.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.campus})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* بازه از تاریخ */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-teal-600" />
                      <span>از تاریخ (شمسی):</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: 1403/07/01"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-mono"
                      dir="ltr"
                    />
                  </div>

                  {/* بازه تا تاریخ */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-teal-600" />
                      <span>تا تاریخ (شمسی):</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: 1403/07/30"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-mono"
                      dir="ltr"
                    />
                  </div>

                  {/* وضعیت اقدام */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      وضعیت رسیدگی:
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="all">همه وضعیت‌ها</option>
                      <option value="resolved">✅ انجام و رفع شده</option>
                      <option value="in_progress">⏳ در حال اقدام / ارجاع شده</option>
                      <option value="waiting_parts">📦 در انتظار قطعه از انبار</option>
                      <option value="pending">⚠️ در انتظار بررسی و صف</option>
                    </select>
                  </div>
                </div>

                {/* نوار جستجو و ریست */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="جستجو در کد پیگیری، موضوع، نام شخص، اتاق یا شرح کار..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {(domainFilter !== 'all' || domainDormFilter !== 'all' || startDate || endDate || statusFilter !== 'all' || searchQuery) && (
                      <button
                        onClick={() => {
                          setDomainFilter('all');
                          setDomainDormFilter('all');
                          setStartDate('');
                          setEndDate('');
                          setStatusFilter('all');
                          setSearchQuery('');
                        }}
                        className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>پاک‌کردن فیلترها</span>
                      </button>
                    )}

                    <button
                      onClick={handleExportDomainReport}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>خروجی اکسل این حوزه</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* کارت‌های شاخص‌های کلیدی عملکرد (KPI Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500">کل موارد ارجاعی حوزه:</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {totalReferredCount.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-[10px] text-slate-400">مورد ثبت شده</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>انجام / رفع نقص شده:</span>
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-200">
                      {resolvedCount.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-[10px] text-emerald-600">قطعی</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                    <span>نرخ تکمیل و تحقق:</span>
                  </span>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-teal-700 dark:text-teal-200">
                        {completionRate}٪
                      </span>
                      <span className="text-[10px] text-teal-600">راندمان</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full transition-all" style={{ width: `${completionRate}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>در حال اقدام / قطعه:</span>
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-extrabold text-blue-700 dark:text-blue-200">
                      {inProgressCount.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-[10px] text-blue-600">جاری</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                    <span>مجموع هزینه‌ها:</span>
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-sm font-extrabold text-amber-800 dark:text-amber-200">
                      {totalRealizedCost.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-[10px] text-amber-600">ریال</span>
                  </div>
                </div>
              </div>

              {/* جدول تفکیکی کارهای ارجاعی */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    ریز فهرست کارهای ارجاعی و اقدامات ثبت‌شده ({filteredWorkItems.length} مورد)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    مرتب‌شده بر اساس تاریخ ثبت
                  </span>
                </div>

                {filteredWorkItems.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      هیچ موردی مطابق فیلترهای تعیین‌شده و بازه زمانی انتخابی یافت نشد.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      می‌توانید بازه تاریخی را بزرگ‌تر کرده یا فیلتر حوزه را روی «همه حوزه‌ها» قرار دهید.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[380px] bg-white dark:bg-slate-900">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3 w-10 text-center">#</th>
                          <th className="p-3">کد ارجاع</th>
                          <th className="p-3">حوزه و دسته‌بندی</th>
                          <th className="p-3">شرح موضوع / سفارش کار</th>
                          <th className="p-3">مکان / سرا</th>
                          <th className="p-3">ثبت‌کننده</th>
                          <th className="p-3">مجری / کارشناس</th>
                          <th className="p-3 text-center">تاریخ</th>
                          <th className="p-3 text-center">وضعیت</th>
                          <th className="p-3 text-left">هزینه (ریال)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredWorkItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="p-3 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]" dir="ltr">
                              {item.trackingCode}
                            </td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${item.domainBadgeColor}`}>
                                {item.domainName}
                              </span>
                            </td>
                            <td className="p-3 max-w-xs">
                              <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                  {item.description}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 font-medium line-clamp-1">
                                  اقدامات: {item.notes}
                                </p>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">
                              <span className="font-semibold">{item.dormName}</span>
                              <span className="text-[10px] text-slate-400 block">{item.location}</span>
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 text-[11px]">
                              {item.requester}
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                              {item.assignee}
                            </td>
                            <td className="p-3 text-center text-[11px] font-mono text-slate-500" dir="ltr">
                              {item.createdDate}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border ${item.statusBadgeColor}`}>
                                {item.statusLabel}
                              </span>
                            </td>
                            <td className="p-3 text-left font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                              {item.cost > 0 ? item.cost.toLocaleString('fa-IR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* تب تخت‌های خالی */}
          {tab === 'vacant' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">فیلتر سرا:</span>
                    <select
                      value={selectedDormFilter}
                      onChange={(e) => setSelectedDormFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="all">تمام سراها</option>
                      {dorms.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">طبقه تخت:</span>
                    <select
                      value={selectedTierFilter}
                      onChange={(e) => setSelectedTierFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="all">هر دو طبقه</option>
                      <option value="lower">فقط طبقه پایین</option>
                      <option value="upper">فقط طبقه بالا</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleExportVacant}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود فایل اکسل تخت‌های خالی</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">ردیف</th>
                      <th className="p-3">سرا و پردیس</th>
                      <th className="p-3">اتاق</th>
                      <th className="p-3">طبقه</th>
                      <th className="p-3">عنوان تخت</th>
                      <th className="p-3">طبقه تخت</th>
                      <th className="p-3">ظرفیت کل اتاق</th>
                      <th className="p-3">سهمیه مجاز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {vacantBedsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                          هیچ تخت خالی مطابق فیلترهای انتخابی یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      vacantBedsList.map((b, idx) => (
                        <tr key={b.bedId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{b.dormName}</td>
                          <td className="p-3 font-bold text-teal-600">اتاق {b.roomNumber}</td>
                          <td className="p-3">{b.floor === 0 ? 'همکف' : b.floor}</td>
                          <td className="p-3">{b.bedLabel}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                b.tier === 'lower'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}
                            >
                              {b.tier === 'lower' ? 'طبقه پایین ⬇️' : 'طبقه بالا ⬆️'}
                            </span>
                          </td>
                          <td className="p-3">{b.roomCapacity} نفره</td>
                          <td className="p-3 text-slate-500">{b.allowedFields}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* تب توزیع استانی */}
          {tab === 'provinces' && (
            <div className="space-y-4">
              {sortedProvinces.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                  هنوز دانشجویی در سامانه ثبت نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedProvinces.map(([prov, count]) => {
                    const percent = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
                    return (
                      <div
                        key={prov}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{prov}</span>
                          <span className="text-xs font-bold text-teal-600">{count} دانشجو ({percent}٪)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-teal-600 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* تب آمار رشته‌ها */}
          {tab === 'majors' && (
            <div className="space-y-4">
              {sortedMajors.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                  هنوز دانشجویی در سامانه ثبت نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedMajors.map(([major, count]) => {
                    const percent = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
                    return (
                      <div
                        key={major}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{major}</span>
                          <span className="text-xs font-bold text-teal-600">{count} نفر ({percent}٪)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* تب پرونده سلامت و بیماری‌ها */}
          {tab === 'health' && (
            <div className="space-y-6">
              {/* توزیع گروه‌های خونی */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  توزیع گروه‌های خونی ساکنین سرا:
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {Object.entries(bloodGroups).map(([bg, count]) => (
                    <div
                      key={bg}
                      className="px-3.5 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2"
                    >
                      <span className="w-3 h-3 rounded-full bg-rose-600" />
                      <span className="font-extrabold text-sm text-rose-900 dark:text-rose-100">{bg}</span>
                      <span className="text-xs text-rose-700 dark:text-rose-300">({count} نفر)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* موارد نیازمند مراقبت ویژه */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  فهرست بیماری‌های خاص و حساسیت‌ها (استخراج شده از ستون‌های سفارشی پرونده):
                </h4>
                {specialConditions.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-400">
                    مورد خاص یا بیماری ثبت شده‌ای یافت نشد.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-600">
                        <tr>
                          <th className="p-2.5">نام دانشجو</th>
                          <th className="p-2.5">بیماری یا ملاحظه خاص</th>
                          <th className="p-2.5">سرا</th>
                          <th className="p-2.5">اتاق</th>
                          <th className="p-2.5">شماره همراه</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {specialConditions.map((sc, i) => (
                          <tr key={i} className="hover:bg-rose-50/50">
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{sc.name}</td>
                            <td className="p-2.5 font-semibold text-rose-600">{sc.condition}</td>
                            <td className="p-2.5">{sc.dorm}</td>
                            <td className="p-2.5">{sc.room}</td>
                            <td className="p-2.5" dir="ltr">{sc.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* دکمه خروجی کلیه اطلاعات به اکسل */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            دانشگاه فرهنگیان اصفهان - اداره امور سراهای دانشجویی
          </span>
          <button
            onClick={handleExportAllStudents}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل اکسل کامل کلیه دانشجویان و اتاق‌ها</span>
          </button>
        </div>

      </div>
    </div>
  );
};
