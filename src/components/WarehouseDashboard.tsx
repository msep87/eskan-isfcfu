import React, { useState } from 'react';
import {
  WarehouseStaff,
  InventoryItem,
  WarehouseRequest,
  Dormitory,
  MaintenanceTask,
} from '../types';
import { Storage } from '../utils/storage';
import {
  Package,
  Boxes,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  Building2,
  Check,
  X,
  FileText,
  Printer,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Phone,
  Layers,
  Wrench,
  Trash2,
  Edit,
  BookOpen,
} from 'lucide-react';

interface WarehouseDashboardProps {
  staff: WarehouseStaff;
  dorms: Dormitory[];
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenUserGuide?: (role: 'warehouse') => void;
}

export const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({
  staff,
  dorms,
  onRefreshData,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'inventory'>('requests');

  // داده‌های انبار
  const inventoryItems = Storage.getInventoryItems();
  const warehouseRequests = Storage.getWarehouseRequests();
  const maintenanceTasks = Storage.getMaintenanceTasks();

  // فیلتر درخواست‌ها
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all');
  const [requestDormFilter, setRequestDormFilter] = useState<string>('all');
  const [requestSearch, setRequestSearch] = useState('');

  // فیلتر موجودی انبار
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // مودال صدور کالا / تحویل حواله
  const [issuingRequest, setIssuingRequest] = useState<WarehouseRequest | null>(null);
  const [issueQty, setIssueQty] = useState<number>(1);
  const [issueUnitPrice, setIssueUnitPrice] = useState<number>(0);
  const [issueNotes, setIssueNotes] = useState('');

  // مودال افزودن قلم کالای جدید به انبار
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<InventoryItem['category']>('plumbing');
  const [newQuantity, setNewQuantity] = useState<number>(10);
  const [newUnit, setNewUnit] = useState('عدد');
  const [newMinLevel, setNewMinLevel] = useState<number>(5);
  const [newUnitPrice, setNewUnitPrice] = useState<number>(100000);
  const [newLocation, setNewLocation] = useState('');

  // مودال ویرایش موجودی / شارژ کالا
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editLocation, setEditLocation] = useState('');

  // مودال صدور مستقیم درخواست اقلام برای سرا
  const [isDirectReqModalOpen, setIsDirectReqModalOpen] = useState(false);
  const [dirDormId, setDirDormId] = useState(dorms[0]?.id || '');
  const [dirItemTitle, setDirItemTitle] = useState('');
  const [dirItemId, setDirItemId] = useState('');
  const [dirQty, setDirQty] = useState(1);
  const [dirUnit, setDirUnit] = useState('عدد');
  const [dirReason, setDirReason] = useState('');
  const [dirUrgency, setDirUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // محاسبات شاخص‌ها
  const totalItemsCount = inventoryItems.length;
  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const lowStockItems = inventoryItems.filter((item) => item.quantity <= item.minStockLevel);
  const lowStockCount = lowStockItems.length;

  const pendingRequests = warehouseRequests.filter(
    (r) => r.status === 'pending_warehouse' || r.status === 'pending_supervisor'
  );
  const readyToIssueCount = warehouseRequests.filter((r) => r.status === 'pending_warehouse').length;
  const totalIssuedCost = warehouseRequests
    .filter((r) => r.status === 'issued')
    .reduce((sum, r) => sum + (r.totalCost || 0), 0);

  // فیلتر درخواست‌ها
  const filteredRequests = warehouseRequests.filter((r) => {
    if (requestStatusFilter !== 'all' && r.status !== requestStatusFilter) return false;
    if (requestDormFilter !== 'all' && r.dormId !== requestDormFilter) return false;
    if (requestSearch.trim()) {
      const q = requestSearch.trim().toLowerCase();
      const matchCode = r.requestCode.toLowerCase().includes(q);
      const matchTitle = r.itemTitle.toLowerCase().includes(q);
      const matchDorm = r.dormName.toLowerCase().includes(q);
      const matchStaff = r.requestedByStaffName.toLowerCase().includes(q);
      const matchTask = (r.taskTrackingCode || '').toLowerCase().includes(q);
      return matchCode || matchTitle || matchDorm || matchStaff || matchTask;
    }
    return true;
  });

  // فیلتر اقلام انبار
  const filteredInventory = inventoryItems.filter((i) => {
    if (inventoryCategoryFilter !== 'all' && i.category !== inventoryCategoryFilter) return false;
    if (onlyLowStock && i.quantity > i.minStockLevel) return false;
    if (inventorySearch.trim()) {
      const q = inventorySearch.trim().toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        (i.location || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // باز کردن مدال صدور کالا
  const handleOpenIssueModal = (req: WarehouseRequest) => {
    setIssuingRequest(req);
    setIssueQty(req.quantityRequested);
    // اگر قلم در انبار تطبیق دارد، قیمت آن را بگذار
    let defaultPrice = 0;
    if (req.inventoryItemId) {
      const found = inventoryItems.find((i) => i.id === req.inventoryItemId);
      if (found) defaultPrice = found.unitPrice;
    } else {
      // جستجوی تقریبی نام کالا در انبار
      const matched = inventoryItems.find((i) => req.itemTitle.includes(i.name) || i.name.includes(req.itemTitle));
      if (matched) defaultPrice = matched.unitPrice;
    }
    setIssueUnitPrice(defaultPrice);
    setIssueNotes('');
  };

  // تأیید و صدور کالا
  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuingRequest) return;

    if (issueQty <= 0) {
      alert('مقدار تحویلی باید بزرگتر از صفر باشد.');
      return;
    }

    const res = Storage.issueWarehouseRequest(issuingRequest.id, {
      warehouseStaffId: staff.id,
      warehouseStaffName: staff.fullName,
      issuedQuantity: issueQty,
      unitPrice: issueUnitPrice,
      warehouseNotes: issueNotes.trim() || undefined,
    });

    if (res.success) {
      showFeedback(`حواله ${issuingRequest.requestCode} با موفقیت صادر و به کارشناس تحویل داده شد.`);
      setIssuingRequest(null);
      onRefreshData();
    } else {
      alert(res.message);
    }
  };

  // افزودن قلم جدید به انبار
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const res = Storage.addInventoryItem({
      code: newCode.trim(),
      name: newName.trim(),
      category: newCategory,
      quantity: Number(newQuantity) || 0,
      unit: newUnit.trim() || 'عدد',
      minStockLevel: Number(newMinLevel) || 5,
      unitPrice: Number(newUnitPrice) || 0,
      location: newLocation.trim() || undefined,
    });

    if (res.success) {
      showFeedback(`قلم کالای «${newName}» با موفقیت به انبار افزوده شد.`);
      setIsAddItemModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewQuantity(10);
      setNewLocation('');
      onRefreshData();
    } else {
      alert(res.message);
    }
  };

  // ویرایش / شارژ کالا
  const handleUpdateItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const res = Storage.updateInventoryItem(editingItem.id, {
      quantity: Number(editQty) || 0,
      unitPrice: Number(editPrice) || 0,
      location: editLocation.trim() || undefined,
      lastRestockedDate: new Date().toLocaleDateString('fa-IR'),
    });

    if (res.success) {
      showFeedback(`اطلاعات و موجودی کالای «${editingItem.name}» بروزرسانی شد.`);
      setEditingItem(null);
      onRefreshData();
    } else {
      alert(res.message);
    }
  };

  // صدور مستقیم درخواست حواله توسط انباردار
  const handleDirectRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirItemTitle.trim() || !dirDormId) return;

    const dormObj = dorms.find((d) => d.id === dirDormId);
    const dormName = dormObj ? dormObj.name : 'سرای دانشجویی';

    const res = Storage.createWarehouseRequest({
      dormId: dirDormId,
      dormName,
      requestedByStaffId: staff.id,
      requestedByStaffName: staff.fullName,
      requestedByRole: 'supervisor', // معادل تایید شده اداری
      itemTitle: dirItemTitle.trim(),
      inventoryItemId: dirItemId || undefined,
      quantityRequested: Number(dirQty) || 1,
      unit: dirUnit.trim() || 'عدد',
      reason: dirReason.trim() || 'تخصیص و تأمین لوازم و تجهیزات مصرفی سرا',
      urgency: dirUrgency,
    });

    if (res.success) {
      showFeedback(res.message);
      setIsDirectReqModalOpen(false);
      setDirItemTitle('');
      setDirReason('');
      onRefreshData();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* بازخورد عملیات */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border shadow-md animate-in slide-in-from-top-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 rounded-lg hover:bg-black/5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* بنر سربرگ انبار و کارپردازی */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-violet-300 shadow-inner">
              <Boxes className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{staff.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/30 text-violet-200 border border-violet-400/30">
                  مدیریت انبار مرکزی، اقلام مصرفی و کارپردازی
                </span>
              </div>
              <p className="text-xs sm:text-sm text-violet-200/80 mt-1 max-w-2xl leading-relaxed">
                تأمین، صدور حواله، انبارداری و رهگیری قطعات مصرفی تأسیسات، خدمات و بهداشت کلیه سراهای دانشجویی پردیس فرهنگیان
              </p>
              <div className="flex items-center gap-4 text-[11px] text-violet-300/80 mt-2">
                <span>تلفن تماس: {staff.phone || staff.mobile || '۰۳۱۳۴۴۴۵۵۶۶'}</span>
                <span>•</span>
                <span>وضعیت: فعال در سامانه</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-violet-900/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت کالای جدید</span>
            </button>
            <button
              onClick={() => setIsDirectReqModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-white/20 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>ثبت حواله مستقیم</span>
            </button>
            <button
              onClick={onOpenMessages}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition border border-white/20 cursor-pointer"
              title="پیام‌ها و تیکت‌های پشتیبانی"
            >
              <FileText className="w-5 h-5" />
            </button>

            {onOpenUserGuide && (
              <button
                onClick={() => onOpenUserGuide('warehouse')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
                title="مشاهده دفترچه راهنمای جامع انبار و تجهیزات و دانلود PDF"
              >
                <BookOpen className="w-4 h-4" />
                <span>راهنمای انبار (PDF)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* کارت‌های شاخص کلیدی انبار */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <Package className="w-4 h-4 text-violet-600" />
            <span>کل اقلام انبار</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalItemsCount}</div>
          <div className="text-[10px] text-slate-400">کالاهای ثبت‌شده در کارتابل</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>نیازمند تحویل حواله</span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{readyToIssueCount}</div>
          <div className="text-[10px] text-amber-600/80">تأییدشده و آماده تحویل</div>
        </div>

        <div
          onClick={() => {
            setActiveTab('inventory');
            setOnlyLowStock(true);
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs cursor-pointer hover:border-rose-400 transition"
        >
          <div className="text-[11px] text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>هشدار کسری موجودی</span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-300 mt-1">{lowStockCount}</div>
          <div className="text-[10px] text-rose-600/80">رسیده به نقطه سفارش کالا</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>ارزش ریالی موجودی</span>
          </div>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1 truncate">
            {Number(Math.round(totalInventoryValue / 1000000)).toLocaleString('fa-IR')} م.ریال
          </div>
          <div className="text-[10px] text-slate-400">برآورد سرمایه انبار</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>حواله‌های صادرشده</span>
          </div>
          <div className="text-lg font-black text-indigo-700 dark:text-indigo-300 mt-1 truncate">
            {Number(Math.round(totalIssuedCost / 1000000)).toLocaleString('fa-IR')} م.ریال
          </div>
          <div className="text-[10px] text-slate-400">مجموع قطعات تحویلی</div>
        </div>
      </div>

      {/* انتخاب تب اصلی */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>کارتابل درخواست‌ها و حواله‌های کالا ({warehouseRequests.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('inventory');
            setOnlyLowStock(false);
          }}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>موجودی کالاها و قطعات انبار ({inventoryItems.length})</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {lowStockCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* تب ۱: کارتابل درخواست‌ها و حواله‌ها */}
      {/* ========================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* فیلترها و جستجوی حواله‌ها */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setRequestStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  requestStatusFilter === 'all'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                همه درخواست‌ها ({warehouseRequests.length})
              </button>
              <button
                onClick={() => setRequestStatusFilter('pending_warehouse')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  requestStatusFilter === 'pending_warehouse'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                آماده تحویل انبار ({readyToIssueCount})
              </button>
              <button
                onClick={() => setRequestStatusFilter('pending_supervisor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  requestStatusFilter === 'pending_supervisor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                در انتظار تأیید سرپرست ({warehouseRequests.filter((r) => r.status === 'pending_supervisor').length})
              </button>
              <button
                onClick={() => setRequestStatusFilter('issued')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  requestStatusFilter === 'issued'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                تحویل‌شده / حواله قطعی ({warehouseRequests.filter((r) => r.status === 'issued').length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={requestDormFilter}
                onChange={(e) => setRequestDormFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-violet-500"
              >
                <option value="all">تمامی سراها</option>
                {dorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجوی کد حواله، نام کالا یا متقاضی..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-violet-500 w-56"
                />
              </div>
            </div>
          </div>

          {/* لیست کارت‌های حواله */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                هیچ درخواست یا حواله‌ای در این فیلتر یافت نشد.
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map((req) => {
                const isReady = req.status === 'pending_warehouse';
                const isIssued = req.status === 'issued';
                const isPendingSup = req.status === 'pending_supervisor';

                return (
                  <div
                    key={req.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between ${
                      isIssued
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10'
                        : isReady
                        ? 'border-amber-400 dark:border-amber-700 ring-2 ring-amber-400/20'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* سربرگ کارت حواله */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                            {req.requestCode}
                          </span>
                          {req.taskTrackingCode && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-200">
                              سفارش کار: {req.taskTrackingCode}
                            </span>
                          )}
                          {req.urgency === 'urgent' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold">
                              فوری
                            </span>
                          )}
                        </div>

                        <div>
                          {isIssued ? (
                            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>تحویل شد</span>
                            </span>
                          ) : isReady ? (
                            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold flex items-center gap-1 border border-amber-300 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>آماده صدور حواله</span>
                            </span>
                          ) : isPendingSup ? (
                            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200">
                              در انتظار تأیید سرپرست
                            </span>
                          ) : (
                            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-bold">
                              رد شده
                            </span>
                          )}
                        </div>
                      </div>

                      {/* عنوان کالا و مقدار */}
                      <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-2">
                        {req.itemTitle}
                      </h3>

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl mb-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">مقدار درخواستی:</span>
                          <span className="font-bold text-violet-700 dark:text-violet-300">
                            {req.quantityRequested} {req.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">سرا و محل مصرف:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{req.dormName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">متقاضی:</span>
                          <span>{req.requestedByStaffName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">تاریخ درخواست:</span>
                          <span className="text-[11px] text-slate-400">{req.requestDate}</span>
                        </div>
                      </div>

                      {req.reason && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 bg-white dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <strong>علت نیاز: </strong>
                          {req.reason}
                        </p>
                      )}

                      {/* اطلاعات تأییدیه سرپرست */}
                      {req.supervisorApproved && (
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-[11px] text-blue-900 dark:text-blue-200 mb-2">
                          <span>تأیید سرپرست: {req.supervisorApprovedBy || 'سرپرستی سرا'}</span>
                          {req.supervisorNotes && <div className="text-[10px] text-blue-700 mt-0.5">{req.supervisorNotes}</div>}
                        </div>
                      )}

                      {/* اطلاعات تحویل قطعی حواله */}
                      {isIssued && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 mb-2">
                          <div className="flex justify-between font-bold">
                            <span>مقدار تحویلی: {req.issuedQuantity} {req.unit}</span>
                            <span>هزینه کل: {Number(req.totalCost || 0).toLocaleString('fa-IR')} ریال</span>
                          </div>
                          <div className="text-[10px] text-emerald-700">تحویل‌دهنده: {req.issuedByStaffName} ({req.issuedAt})</div>
                          {req.warehouseNotes && <div className="text-[10px] text-emerald-600">یادداشت انبار: {req.warehouseNotes}</div>}
                        </div>
                      )}
                    </div>

                    {/* دکمه‌های عملیاتی انباردار */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400">
                        {isReady ? 'تأیید شده، آماده تحویل' : isIssued ? 'حواله نهایی صادر شد' : 'در انتظار بررسی'}
                      </div>

                      <div className="flex items-center gap-2">
                        {isReady && (
                          <button
                            onClick={() => handleOpenIssueModal(req)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            <span>صدور و تحویل کالا</span>
                          </button>
                        )}

                        {isIssued && (
                          <button
                            onClick={() => window.print()}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="چاپ قبض انبار"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>چاپ رسید</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* تب ۲: موجودی کالاها و قطعات انبار (Inventory Catalog) */}
      {/* ========================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* فیلترها و جستجوی کاتالوگ انبار */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setInventoryCategoryFilter('all');
                  setOnlyLowStock(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inventoryCategoryFilter === 'all' && !onlyLowStock
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                همه دسته‌ها ({inventoryItems.length})
              </button>
              <button
                onClick={() => {
                  setInventoryCategoryFilter('plumbing');
                  setOnlyLowStock(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inventoryCategoryFilter === 'plumbing'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                شیرآلات و لوله‌کشی
              </button>
              <button
                onClick={() => {
                  setInventoryCategoryFilter('electrical');
                  setOnlyLowStock(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inventoryCategoryFilter === 'electrical'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                برق و روشنایی
              </button>
              <button
                onClick={() => {
                  setInventoryCategoryFilter('carpentry');
                  setOnlyLowStock(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inventoryCategoryFilter === 'carpentry'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                نجاری و قفل
              </button>
              <button
                onClick={() => {
                  setInventoryCategoryFilter('cleaning');
                  setOnlyLowStock(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inventoryCategoryFilter === 'cleaning'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                بهداشت و شوینده
              </button>
              <button
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  onlyLowStock
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>کسری موجودی ({lowStockCount})</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="جستجوی کد کالا، نام یا قفسه..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-violet-500 w-56"
              />
            </div>
          </div>

          {/* جدول فهرست موجودی اقلام انبار */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">کد کالا</th>
                    <th className="py-3 px-4 font-bold">نام و شرح قلم کالا</th>
                    <th className="py-3 px-4 font-bold">دسته بندی</th>
                    <th className="py-3 px-4 font-bold text-center">موجودی فعلی</th>
                    <th className="py-3 px-4 font-bold">حداقل هشدار</th>
                    <th className="py-3 px-4 font-bold">قیمت واحد (ریال)</th>
                    <th className="py-3 px-4 font-bold">قفسه و مکان</th>
                    <th className="py-3 px-4 font-bold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInventory.map((item) => {
                    const isLow = item.quantity <= item.minStockLevel;
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                          isLow ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-700 dark:text-violet-300">
                          {item.code}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          {isLow && (
                            <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              <span>کسری موجودی - نیاز به خرید و شارژ</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {item.categoryLabel || item.category}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-black inline-block ${
                              isLow
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            }`}
                          >
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {item.minStockLevel} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {Number(item.unitPrice).toLocaleString('fa-IR')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {item.location || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setEditQty(item.quantity);
                                setEditPrice(item.unitPrice);
                                setEditLocation(item.location || '');
                              }}
                              className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="شارژ و ویرایش موجودی"
                            >
                              <Edit className="w-3 h-3" />
                              <span>شارژ / ویرایش</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۱: صدور و تحویل کالا (Issue Request) */}
      {/* ========================================================= */}
      {issuingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    صدور حواله و تحویل کالا از انبار
                  </h3>
                  <p className="text-xs text-slate-400">
                    کد حواله: {issuingRequest.requestCode} • {issuingRequest.dormName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIssuingRequest(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmIssue} className="space-y-4 mt-4">
              <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-2xl border border-violet-100 text-xs space-y-1">
                <div className="font-bold text-violet-900 dark:text-violet-200">
                  شرح قلم: {issuingRequest.itemTitle}
                </div>
                <div className="text-violet-700 dark:text-violet-300">
                  متقاضی: {issuingRequest.requestedByStaffName}
                </div>
                {issuingRequest.taskTrackingCode && (
                  <div className="text-violet-600">
                    متصل به سفارش کار تأسیسات: {issuingRequest.taskTrackingCode}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مقدار تحویلی ({issuingRequest.unit}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={issueQty}
                    onChange={(e) => setIssueQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    قیمت واحد به ریال *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={issueUnitPrice}
                    onChange={(e) => setIssueUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs flex justify-between font-extrabold text-slate-900 dark:text-white">
                <span>مجموع هزینه حواله خروجی:</span>
                <span className="text-violet-700 dark:text-violet-300">
                  {Number(issueQty * issueUnitPrice).toLocaleString('fa-IR')} ریال
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  یادداشت و شماره رسید انبار / فاکتور
                </label>
                <textarea
                  rows={2}
                  placeholder="مثلاً: کالای نو تحویل تکنسین شد و امضای رسید اخذ گردید..."
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأیید خروج از انبار و صدور رسید</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIssuingRequest(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۲: افزودن قلم کالای جدید به کاتالوگ انبار */}
      {/* ========================================================= */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-600">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    ثبت قلم کالای جدید در انبار
                  </h3>
                  <p className="text-xs text-slate-400">افزودن قطعه، تجهیزات یا مواد مصرفی به سامانه</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    کد کالا *
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً PLM-104"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-left dir-ltr"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    دسته‌بندی کالا *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  >
                    <option value="plumbing">تأسیسات لوله‌کشی و شیرآلات</option>
                    <option value="electrical">برق و روشنایی</option>
                    <option value="carpentry">نجاری، ابنیه و قفل</option>
                    <option value="cleaning">بهداشت و مواد شوینده</option>
                    <option value="general">تجهیزات عمومی سراها</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام کامل کالا یا قطعه *
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: شیر اهرمی ظرفشویی قهرمان"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    موجودی اولیه
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    واحد شمارش
                  </label>
                  <input
                    type="text"
                    placeholder="عدد / متر / گالن"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حداقل هشدار
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMinLevel}
                    onChange={(e) => setNewMinLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    قیمت واحد (ریال)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    قفسه و موقعیت انبار
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً قفسه B3"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت و ذخیره کالا در انبار</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۳: شارژ / ویرایش موجودی قلم کالا */}
      {/* ========================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                شارژ موجودی / ویرایش: {editingItem.name}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateItemSubmit} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  موجودی جدید ({editingItem.unit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editQty}
                  onChange={(e) => setEditQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  قیمت واحد (ریال)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  مکان در انبار
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold"
                >
                  ذخیره تغییرات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۴: ثبت حواله مستقیم توسط انباردار */}
      {/* ========================================================= */}
      {isDirectReqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                ثبت حواله و تخصیص مستقیم کالا برای سرا
              </h3>
              <button
                onClick={() => setIsDirectReqModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDirectRequestSubmit} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  سرای مقصد *
                </label>
                <select
                  value={dirDormId}
                  onChange={(e) => setDirDormId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  {dorms.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب از کاتالوگ انبار (اختیاری)
                </label>
                <select
                  value={dirItemId}
                  onChange={(e) => {
                    setDirItemId(e.target.value);
                    const it = inventoryItems.find((i) => i.id === e.target.value);
                    if (it) {
                      setDirItemTitle(it.name);
                      setDirUnit(it.unit);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium mb-1.5"
                >
                  <option value="">-- انتخاب قلم از لیست کالاها --</option>
                  {inventoryItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.code} - {it.name} (موجودی: {it.quantity} {it.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="یا عنوان قلم کالا را دستی بنویسید..."
                  value={dirItemTitle}
                  onChange={(e) => setDirItemTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مقدار حواله *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dirQty}
                    onChange={(e) => setDirQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    واحد
                  </label>
                  <input
                    type="text"
                    value={dirUnit}
                    onChange={(e) => setDirUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  محل مصرف و دلیل تحویل
                </label>
                <textarea
                  rows={2}
                  placeholder="مثلاً: تحویل شوینده ماهانه به خدمات سرا..."
                  value={dirReason}
                  onChange={(e) => setDirReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold"
                >
                  ثبت حواله آماده تحویل
                </button>
                <button
                  type="button"
                  onClick={() => setIsDirectReqModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
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
