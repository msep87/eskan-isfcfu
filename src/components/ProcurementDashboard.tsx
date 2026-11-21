import React, { useState, useMemo } from 'react';
import { PersianDatePicker } from './PersianDatePicker';
import {
  ProcurementStaff,
  ProcurementRequest,
  ProcurementRequestStatus,
  Dormitory,
} from '../types';
import { Storage } from '../utils/storage';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Search,
  DollarSign,
  FileSpreadsheet,
  Edit3,
  X,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Building2,
  Receipt,
  Calculator,
  Boxes,
} from 'lucide-react';

interface ProcurementDashboardProps {
  staff: ProcurementStaff;
  dorms: Dormitory[];
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenUserGuide?: (role: 'procurement') => void;
}

const STATUS_META: Record<
  ProcurementRequestStatus,
  { label: string; badgeClass: string; cardBorder: string }
> = {
  pending_purchase: {
    label: 'در انتظار خرید',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    cardBorder: 'border-amber-300/80 dark:border-amber-800/70',
  },
  purchasing: {
    label: 'در حال خرید و استعلام',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    cardBorder: 'border-blue-300/80 dark:border-blue-800/70',
  },
  purchased: {
    label: 'خریداری‌شده (منتظر تحویل به انبار)',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    cardBorder: 'border-indigo-300/80 dark:border-indigo-800/70',
  },
  delivered_to_warehouse: {
    label: 'تحویل به انبار (منتظر تأیید مسئول انبار)',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    cardBorder: 'border-orange-400 dark:border-orange-700 ring-1 ring-orange-400/20',
  },
  warehouse_confirmed: {
    label: 'تأیید انبار و واردشده به موجودی',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    cardBorder: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10',
  },
  cancelled: {
    label: 'لغو شده',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    cardBorder: 'border-slate-200 dark:border-slate-800 opacity-85',
  },
};

export const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({
  staff,
  dorms,
  onRefreshData,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  const requests = Storage.getProcurementRequests();

  const [statusFilter, setStatusFilter] = useState<'all' | ProcurementRequestStatus>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'normal' | 'urgent' | 'emergency'>('all');
  const [dormFilter, setDormFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // مودال ثبت / ویرایش وضعیت خرید و تحویل
  const [editingRequest, setEditingRequest] = useState<ProcurementRequest | null>(null);
  const [formStatus, setFormStatus] = useState<ProcurementRequestStatus>('purchasing');
  const [formPurchasedQty, setFormPurchasedQty] = useState<number>(1);
  const [formItemCount, setFormItemCount] = useState<number>(1);
  const [formUnitPrice, setFormUnitPrice] = useState<number>(0);
  const [formTotalPrice, setFormTotalPrice] = useState<number>(0);
  const [autoCalcTotal, setAutoCalcTotal] = useState<boolean>(true);
  const [formDeliveryStatus, setFormDeliveryStatus] = useState<'not_delivered' | 'delivered'>('not_delivered');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [modalError, setModalError] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // محاسبه شاخص‌ها
  const stats = useMemo(() => {
    const pendingPurchase = requests.filter((r) => r.status === 'pending_purchase').length;
    const purchasing = requests.filter((r) => r.status === 'purchasing').length;
    const purchased = requests.filter((r) => r.status === 'purchased').length;
    const deliveredToWarehouse = requests.filter((r) => r.status === 'delivered_to_warehouse').length;
    const confirmed = requests.filter((r) => r.status === 'warehouse_confirmed').length;
    const totalSpent = requests
      .filter((r) => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);

    return {
      total: requests.length,
      pendingPurchase,
      purchasing,
      purchased,
      deliveredToWarehouse,
      confirmed,
      totalSpent,
    };
  }, [requests]);

  // فیلتر کردن درخواست‌ها
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) return false;
      if (dormFilter !== 'all' && r.dormId !== dormFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hit =
          r.trackingCode.toLowerCase().includes(q) ||
          r.itemTitle.toLowerCase().includes(q) ||
          (r.itemCode || '').toLowerCase().includes(q) ||
          (r.warehouseRequestCode || '').toLowerCase().includes(q) ||
          (r.supplierName || '').toLowerCase().includes(q) ||
          (r.invoiceNumber || '').toLowerCase().includes(q) ||
          (r.dormName || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [requests, statusFilter, urgencyFilter, dormFilter, searchQuery]);

  const openEditModal = (req: ProcurementRequest) => {
    setEditingRequest(req);
    setModalError('');
    const initQty = req.purchasedQuantity ?? req.requestedQuantity ?? 1;
    const initCount = req.purchasedItemCount ?? initQty;
    const initUnitPrice = req.unitPrice ?? 0;
    const initTotal = req.totalPrice ?? initQty * initUnitPrice;

    setFormStatus(
      req.status === 'delivered_to_warehouse'
        ? 'purchased'
        : req.status === 'pending_purchase'
        ? 'purchasing'
        : req.status
    );
    setFormPurchasedQty(initQty);
    setFormItemCount(initCount);
    setFormUnitPrice(initUnitPrice);
    setFormTotalPrice(initTotal);
    setAutoCalcTotal(req.totalPrice === undefined || req.totalPrice === initQty * initUnitPrice);
    setFormDeliveryStatus(req.deliveryStatus || 'not_delivered');
    setFormSupplierName(req.supplierName || '');
    setFormInvoiceNumber(req.invoiceNumber || '');
    setFormPurchaseDate(req.purchaseDate || new Date().toLocaleDateString('fa-IR'));
    setFormNotes(req.procurementNotes || '');
  };

  const handleQtyChange = (val: number) => {
    const qty = Math.max(0, val);
    setFormPurchasedQty(qty);
    if (autoCalcTotal) {
      setFormTotalPrice(qty * formUnitPrice);
    }
  };

  const handleUnitPriceChange = (val: number) => {
    const price = Math.max(0, val);
    setFormUnitPrice(price);
    if (autoCalcTotal) {
      setFormTotalPrice(formPurchasedQty * price);
    }
  };

  const handleSavePurchaseUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    setModalError('');

    if (formStatus !== 'cancelled' && formPurchasedQty <= 0 && (formDeliveryStatus === 'delivered' || formStatus === 'purchased')) {
      setModalError('برای ثبت خرید یا تحویل به انبار، مقدار خریداری‌شده باید بزرگ‌تر از صفر باشد.');
      return;
    }

    const res = Storage.updateProcurementPurchase(editingRequest.id, {
      status: formStatus,
      purchasedQuantity: formPurchasedQty,
      purchasedItemCount: formItemCount,
      unitPrice: formUnitPrice,
      totalPrice: formTotalPrice,
      supplierName: formSupplierName,
      invoiceNumber: formInvoiceNumber,
      purchaseDate: formPurchaseDate,
      procurementNotes: formNotes,
      deliveryStatus: formStatus === 'cancelled' ? 'not_delivered' : formDeliveryStatus,
      actorId: staff.id,
      actorName: staff.fullName,
    });

    if (res.success) {
      showFeedback(res.message, 'success');
      setEditingRequest(null);
      onRefreshData();
    } else {
      setModalError(res.message || 'خطا در بروزرسانی اطلاعات خرید');
    }
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const rows = filteredRequests.map((r, idx) => ({
      'ردیف': idx + 1,
      'کد پیگیری خرید': r.trackingCode,
      'کد حواله انبار': r.warehouseRequestCode || '-',
      'نام کالا / قطعه': r.itemTitle,
      'کد کالا': r.itemCode || '-',
      'سرای مقصد': r.dormName || '-',
      'مقدار درخواستی': r.requestedQuantity,
      'واحد': r.unit,
      'وضعیت خرید': STATUS_META[r.status]?.label || r.status,
      'وضعیت تحویل به انبار': r.deliveryStatus === 'delivered' ? 'تحویل به انبار شد' : 'عدم تحویل به انبار',
      'مقدار خریداری‌شده': r.purchasedQuantity ?? '-',
      'تعداد اقلام / بسته': r.purchasedItemCount ?? '-',
      'قیمت واحد (ریال)': r.unitPrice ?? 0,
      'مبلغ کل خرید (ریال)': r.totalPrice ?? 0,
      'فروشنده / تأمین‌کننده': r.supplierName || '-',
      'شماره فاکتور': r.invoiceNumber || '-',
      'تاریخ خرید': r.purchaseDate || '-',
      'ارجاع‌دهنده (انبار)': r.referredByStaffName,
      'تاریخ ارجاع': r.referredAt,
      'تأییدکننده انبار': r.warehouseConfirmedBy || '-',
      'توضیحات کارپرداز': r.procurementNotes || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ارجاعات خرید کارپردازی');
    XLSX.writeFile(wb, `گزارش_کارپردازی_و_خرید_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* بنر بازخورد عملیات */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border shadow-md animate-in slide-in-from-top-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 rounded-lg hover:bg-black/5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* بنر سربرگ کارپرداز */}
      <div className="bg-gradient-to-r from-orange-800 via-amber-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {staff.photoUrl ? (
              <img
                src={staff.photoUrl}
                alt={staff.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg shrink-0"
              />
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-orange-200 shadow-inner">
                <ShoppingBag className="w-9 h-9" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{staff.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/30 text-orange-100 border border-orange-300/30">
                  کارتابل کارپردازی و خرید تدارکات سراها
                </span>
              </div>
              <p className="text-xs sm:text-sm text-orange-100/85 mt-1 max-w-2xl leading-relaxed">
                دریافت ارجاعات کسری و اقلام ناموجود از مسئول انبار، ثبت قیمت، مقدار و تعداد خرید، و اعلام تحویل به انبار جهت تأیید و ورود به موجودی
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-orange-200/85 mt-2">
                <span>واحد: {staff.department || 'واحد کارپردازی و خرید'}</span>
                <span>•</span>
                <span>تماس: {staff.phone || staff.mobile || '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>خروجی اکسل خریدها</span>
            </button>

            <button
              onClick={onOpenMessages}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
              title="پیام‌ها و ارتباط با انبار و مدیریت"
            >
              <MessageSquare className="w-4 h-4" />
              <span>پیام‌ها</span>
            </button>

            {onOpenUserGuide && (
              <button
                onClick={() => onOpenUserGuide('procurement')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>راهنمای کارپرداز (PDF)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* کارت‌های شاخص کلیدی کارپردازی */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-orange-300 transition"
        >
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-orange-600" />
            <span>کل ارجاعات</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400">درخواست‌های خرید انبار</div>
        </div>

        <div
          onClick={() => setStatusFilter('pending_purchase')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs cursor-pointer hover:border-amber-400 transition"
        >
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>در انتظار خرید</span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1">{stats.pendingPurchase}</div>
          <div className="text-[10px] text-amber-600/80">نیازمند اقدام کارپرداز</div>
        </div>

        <div
          onClick={() => setStatusFilter('purchasing')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-xs cursor-pointer hover:border-blue-400 transition"
        >
          <div className="text-[11px] text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-blue-500" />
            <span>در حال خرید</span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-300 mt-1">{stats.purchasing}</div>
          <div className="text-[10px] text-blue-600/80">استعلام و پیگیری خرید</div>
        </div>

        <div
          onClick={() => setStatusFilter('delivered_to_warehouse')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-orange-200 dark:border-orange-900/50 shadow-xs cursor-pointer hover:border-orange-400 transition"
        >
          <div className="text-[11px] text-orange-700 dark:text-orange-400 font-bold flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-orange-600" />
            <span>تحویل به انبار</span>
          </div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-300 mt-1">
            {stats.deliveredToWarehouse}
          </div>
          <div className="text-[10px] text-orange-600/80">در انتظار تأیید انباردار</div>
        </div>

        <div
          onClick={() => setStatusFilter('warehouse_confirmed')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs cursor-pointer hover:border-emerald-400 transition"
        >
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            <span>واردشده به انبار</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-1">{stats.confirmed}</div>
          <div className="text-[10px] text-emerald-600/80">تأیید نهایی مسئول انبار</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>جمع مبالغ خرید</span>
          </div>
          <div className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1.5 truncate">
            {Number(stats.totalSpent).toLocaleString('fa-IR')} ریال
          </div>
          <div className="text-[10px] text-slate-400">مجموع فاکتورهای ثبت‌شده</div>
        </div>
      </div>

      {/* نوار فیلترها و جستجو */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'all', label: `همه موارد (${requests.length})` },
              { key: 'pending_purchase', label: `در انتظار خرید (${stats.pendingPurchase})` },
              { key: 'purchasing', label: `در حال خرید (${stats.purchasing})` },
              { key: 'purchased', label: `خریداری‌شده / عدم تحویل (${stats.purchased})` },
              { key: 'delivered_to_warehouse', label: `تحویل‌شده به انبار (${stats.deliveredToWarehouse})` },
              { key: 'warehouse_confirmed', label: `تأیید انبار (${stats.confirmed})` },
              { key: 'cancelled', label: 'لغو شده' },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === f.key
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            >
              <option value="all">همه سطوح فوریت</option>
              <option value="emergency">اضطراری</option>
              <option value="urgent">فوری</option>
              <option value="normal">عادی</option>
            </select>

            <select
              value={dormFilter}
              onChange={(e) => setDormFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            >
              <option value="all">همه سراها</option>
              {dorms.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="جستجوی کد پیگیری، نام کالا، فروشنده یا فاکتور..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-orange-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* لیست ارجاعات خرید */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            هیچ درخواست خریدی در این فیلتر یافت نشد.
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            درخواست‌هایی که مسئول انبار به دلیل کسری یا عدم موجودی ارجاع دهد در این بخش نمایش داده می‌شوند.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const meta = STATUS_META[req.status] || STATUS_META.pending_purchase;
            const isLocked = req.status === 'warehouse_confirmed' || req.warehouseConfirmed;

            return (
              <div
                key={req.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-xs flex flex-col justify-between transition ${meta.cardBorder}`}
              >
                <div>
                  {/* سربرگ کارت */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                        {req.trackingCode}
                      </span>
                      {req.warehouseRequestCode && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold border border-violet-200 dark:border-violet-800">
                          حواله انبار: {req.warehouseRequestCode}
                        </span>
                      )}
                      {req.urgency === 'emergency' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                          اضطراری
                        </span>
                      )}
                      {req.urgency === 'urgent' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold">
                          فوری
                        </span>
                      )}
                    </div>

                    <span className={`text-[10px] px-2.5 py-1 rounded-xl border font-extrabold ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* نام کالا */}
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-2">
                    {req.itemTitle}
                    {req.itemCode && (
                      <span className="mr-2 font-mono text-[11px] font-bold text-slate-400">({req.itemCode})</span>
                    )}
                  </h3>

                  {/* جزئیات درخواست ارجاع‌شده */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl mb-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">مقدار درخواستی انبار:</span>
                      <span className="font-black text-orange-700 dark:text-orange-300">
                        {req.requestedQuantity} {req.unit}
                      </span>
                    </div>
                    {req.dormName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>سرای مقصد:</span>
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{req.dormName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ارجاع‌دهنده:</span>
                      <span>
                        {req.referredByStaffName} • <span className="text-[11px] text-slate-400">{req.referredAt}</span>
                      </span>
                    </div>
                    {req.assignedProcurementName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">کارپرداز مسئول:</span>
                        <span className="font-semibold">{req.assignedProcurementName}</span>
                      </div>
                    )}
                  </div>

                  {req.reason && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-3 p-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <strong className="text-slate-700 dark:text-slate-300">علت ارجاع: </strong>
                      {req.reason}
                    </div>
                  )}

                  {/* اطلاعات خرید ثبت‌شده توسط کارپرداز */}
                  {(req.purchasedQuantity !== undefined || req.totalPrice !== undefined || req.supplierName || req.invoiceNumber) && (
                    <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 text-xs space-y-1.5 mb-3">
                      <div className="flex items-center justify-between font-bold text-orange-900 dark:text-orange-200">
                        <span>
                          مقدار خرید: {req.purchasedQuantity ?? 0} {req.unit}
                          {req.purchasedItemCount !== undefined ? ` (${req.purchasedItemCount} قلم/بسته)` : ''}
                        </span>
                        <span>
                          قیمت واحد: {Number(req.unitPrice || 0).toLocaleString('fa-IR')} ریال
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-orange-800 dark:text-orange-300 font-extrabold">
                        <span>مبلغ کل خرید:</span>
                        <span>{Number(req.totalPrice || 0).toLocaleString('fa-IR')} ریال</span>
                      </div>
                      {(req.supplierName || req.invoiceNumber || req.purchaseDate) && (
                        <div className="text-[11px] text-orange-700 dark:text-orange-400 flex flex-wrap gap-x-3 gap-y-0.5">
                          {req.supplierName && <span>فروشنده: {req.supplierName}</span>}
                          {req.invoiceNumber && <span>فاکتور: {req.invoiceNumber}</span>}
                          {req.purchaseDate && <span>تاریخ خرید: {req.purchaseDate}</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-orange-200/70 dark:border-orange-900/50 text-[11px]">
                        <span className="font-bold">وضعیت تحویل به انبار:</span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-extrabold ${
                            req.deliveryStatus === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {req.deliveryStatus === 'delivered' ? 'تحویل به انبار شد' : 'عدم تحویل به انبار'}
                        </span>
                      </div>
                      {req.procurementNotes && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          یادداشت کارپرداز: {req.procurementNotes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* تأییدیه انبار یا یادداشت برگشت */}
                  {req.warehouseConfirmed && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold">
                          تأیید و واردشده به موجودی انبار توسط: {req.warehouseConfirmedBy} ({req.warehouseConfirmedAt})
                        </div>
                        {req.warehouseConfirmNotes && <div>{req.warehouseConfirmNotes}</div>}
                      </div>
                    </div>
                  )}

                  {!req.warehouseConfirmed && req.warehouseConfirmNotes && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-200 mb-3">
                      <strong>یادداشت مسئول انبار: </strong>
                      {req.warehouseConfirmNotes}
                    </div>
                  )}
                </div>

                {/* دکمه اقدام */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    {isLocked
                      ? 'پرونده خرید بسته و به انبار منتقل شده است'
                      : req.deliveryStatus === 'delivered'
                      ? 'منتظر تأیید فیزیکی توسط مسئول انبار'
                      : 'قابل ویرایش و ثبت اطلاعات خرید'}
                  </div>

                  {!isLocked && (
                    <button
                      onClick={() => openEditModal(req)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ثبت وضعیت خرید، قیمت و تحویل</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال ثبت / ویرایش خرید و تحویل به انبار */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    ثبت اطلاعات خرید و تحویل به انبار
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingRequest.trackingCode} • {editingRequest.itemTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRequest(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSavePurchaseUpdate} className="space-y-4 mt-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-500 font-semibold">درخواست اولیه انبار:</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {editingRequest.requestedQuantity} {editingRequest.unit}
                  {editingRequest.dormName ? ` (${editingRequest.dormName})` : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وضعیت فعلی فرآیند خرید *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProcurementRequestStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="pending_purchase">در انتظار خرید</option>
                    <option value="purchasing">در حال خرید و استعلام قیمت</option>
                    <option value="purchased">خریداری‌شده</option>
                    <option value="cancelled">لغو شده / عدم نیاز</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وضعیت تحویل به انبار *
                  </label>
                  <select
                    value={formStatus === 'cancelled' ? 'not_delivered' : formDeliveryStatus}
                    disabled={formStatus === 'cancelled'}
                    onChange={(e) => setFormDeliveryStatus(e.target.value as 'not_delivered' | 'delivered')}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      formDeliveryStatus === 'delivered' && formStatus !== 'cancelled'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <option value="not_delivered">عدم تحویل به انبار (هنوز تحویل نشده)</option>
                    <option value="delivered">تحویل به انبار شد (ارسال جهت تأیید انبار)</option>
                  </select>
                </div>
              </div>

              {formDeliveryStatus === 'delivered' && formStatus !== 'cancelled' && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[11px] leading-relaxed">
                  با ثبت گزینه «تحویل به انبار شد»، وضعیت درخواست به <strong>تحویل‌شده به انبار</strong> تغییر می‌یابد و تنها پس از بررسی و تأیید نهایی مسئول انبار به موجودی انبار منتقل می‌شود.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مقدار خریداری‌شده ({editingRequest.unit}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formPurchasedQty}
                    onChange={(e) => handleQtyChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تعداد اقلام / بسته
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formItemCount}
                    onChange={(e) => setFormItemCount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    قیمت واحد (ریال)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formUnitPrice}
                    onChange={(e) => handleUnitPriceChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      مبلغ کل خرید (ریال)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoCalcTotal(true);
                        setFormTotalPrice(formPurchasedQty * formUnitPrice);
                      }}
                      className="text-[10px] text-orange-600 hover:text-orange-700 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>محاسبه خودکار</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formTotalPrice}
                    onChange={(e) => {
                      setAutoCalcTotal(false);
                      setFormTotalPrice(Math.max(0, Number(e.target.value)));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام فروشنده / فروشگاه
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: تأسیسات سپاهان"
                    value={formSupplierName}
                    onChange={(e) => setFormSupplierName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره فاکتور
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: 1405-882"
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dir-ltr text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ خرید
                  </label>
                  <PersianDatePicker
                    placeholder="۱۴۰۵/۰۷/۲۰"
                    value={formPurchaseDate}
                    onChange={setFormPurchaseDate}
                    digits="fa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات کارپرداز و جزئیات تحویل
                </label>
                <textarea
                  rows={2}
                  placeholder="توضیح کیفیت کالا، برند خریداری‌شده، شرایط تحویل به انباردار..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ذخیره اطلاعات خرید و تحویل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
