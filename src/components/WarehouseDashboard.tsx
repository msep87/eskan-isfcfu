import React, { useState, useEffect, useMemo } from 'react';
import {
  WarehouseStaff,
  InventoryItem,
  InventoryTransaction,
  WarehouseRequest,
  ProcurementRequest,
  Dormitory,
} from '../types';
import { Storage } from '../utils/storage';
import { WAREHOUSE_REQUESTER_ROLE_LABELS } from '../utils/warehouseCatalog';
import {
  downloadInventoryTemplate,
  parseInventoryExcel,
  exportInventoryToExcel,
} from '../utils/excelUtils';
import { GraduationClearanceReviewPanel } from './GraduationClearanceReviewPanel';
import { CollapsibleMenuGrid } from './CollapsibleMenuGrid';
import {
  Package,
  Boxes,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  DollarSign,
  Check,
  X,
  FileText,
  Printer,
  ShieldAlert,
  Trash2,
  Edit,
  BookOpen,
  ShoppingBag,
  ArrowDownCircle,
  ArrowUpCircle,
  FileSpreadsheet,
  UploadCloud,
  Download,
  Truck,
  PackageCheck,
  History,
  AlertCircle,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';

interface WarehouseDashboardProps {
  staff: WarehouseStaff;
  dorms: Dormitory[];
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenUserGuide?: (role: 'warehouse') => void;
}

const PROC_STATUS_LABELS: Record<ProcurementRequest['status'], { label: string; cls: string }> = {
  pending_purchase: { label: 'در انتظار خرید کارپرداز', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  purchasing: { label: 'در حال خرید توسط کارپرداز', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  purchased: { label: 'خریداری‌شده (عدم تحویل)', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  delivered_to_warehouse: { label: 'تحویل کارپرداز (در انتظار تأیید انبار)', cls: 'bg-orange-100 text-orange-800 border-orange-300' },
  warehouse_confirmed: { label: 'تأیید انبار و واردشده به موجودی', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  cancelled: { label: 'لغو شده', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
};

const CATEGORY_LABELS: Record<InventoryItem['category'], string> = {
  plumbing: 'شیرآلات و لوله‌کشی',
  electrical: 'برق و روشنایی',
  carpentry: 'نجاری، ابنیه و قفل',
  cleaning: 'بهداشت و مواد شوینده',
  general: 'تجهیزات عمومی',
};

interface BulkRowDraft {
  code: string;
  name: string;
  category: InventoryItem['category'];
  quantity: number;
  unit: string;
  minStockLevel: number;
  unitPrice: number;
  location: string;
}

export const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({
  staff,
  dorms,
  onRefreshData,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'procurement' | 'inventory' | 'transactions' | 'clearance' | null>(null);

  // داده‌های زنده انبار و کارپردازی
  const inventoryItems = Storage.getInventoryItems();
  const warehouseRequests = Storage.getWarehouseRequests();
  const procurementRequests = Storage.getProcurementRequests();
  const inventoryTransactions = Storage.getInventoryTransactions();
  const procurementStaffList = Storage.getProcurementStaff().filter(
    (p) => p.status === 'active' || p.isActive !== false
  );

  // فیلتر درخواست‌ها
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all');
  const [requestDormFilter, setRequestDormFilter] = useState<string>('all');
  const [requestSearch, setRequestSearch] = useState('');

  // فیلتر ارجاعات کارپرداز
  const [procStatusFilter, setProcStatusFilter] = useState<string>('all');
  const [procSearch, setProcSearch] = useState('');

  // فیلتر موجودی انبار
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // فیلتر کاردکس ورودی/خروجی
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [txSearch, setTxSearch] = useState('');

  // مودال صدور کالا / تحویل حواله
  const [issuingRequest, setIssuingRequest] = useState<WarehouseRequest | null>(null);
  const [issueQty, setIssueQty] = useState<number>(1);
  const [issueUnitPrice, setIssueUnitPrice] = useState<number>(0);
  const [issueNotes, setIssueNotes] = useState('');
  const [issueModalError, setIssueModalError] = useState('');

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
  const [addModalError, setAddModalError] = useState('');

  // مودال ویرایش مشخصات کالا
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editCategory, setEditCategory] = useState<InventoryItem['category']>('general');
  const [editUnit, setEditUnit] = useState('عدد');
  const [editMinLevel, setEditMinLevel] = useState<number>(5);
  const [editQty, setEditQty] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editLocation, setEditLocation] = useState('');
  const [editModalError, setEditModalError] = useState('');

  // مودال حذف کالا (بدون window.confirm)
  const [deleteTargetItem, setDeleteTargetItem] = useState<InventoryItem | null>(null);

  // مودال ورودی / خروجی موجودی (+ ورودی / - خروجی)
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustUnitPrice, setAdjustUnitPrice] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustRefCode, setAdjustRefCode] = useState('');
  const [adjustDormName, setAdjustDormName] = useState('');
  const [adjustError, setAdjustError] = useState('');

  // مودال ورود لیستی مواد و وسایل (چندردیفه دستی)
  const [isBulkEntryModalOpen, setIsBulkEntryModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'add_stock' | 'merge'>('add_stock');
  const [bulkRows, setBulkRows] = useState<BulkRowDraft[]>([
    { code: '', name: '', category: 'general', quantity: 10, unit: 'عدد', minStockLevel: 3, unitPrice: 0, location: 'انبار مرکزی' },
  ]);
  const [bulkModalError, setBulkModalError] = useState('');

  // مودال ورود لیست کالاها از فایل اکسل
  const [isExcelInventoryModalOpen, setIsExcelInventoryModalOpen] = useState(false);
  const [excelImportMode, setExcelImportMode] = useState<'add_stock' | 'merge'>('add_stock');
  const [excelPreviewItems, setExcelPreviewItems] = useState<Array<Omit<InventoryItem, 'id'>> | null>(null);
  const [excelSkippedRows, setExcelSkippedRows] = useState(0);
  const [excelModalError, setExcelModalError] = useState('');

  // مودال صدور مستقیم درخواست اقلام برای سرا
  const [isDirectReqModalOpen, setIsDirectReqModalOpen] = useState(false);
  const [dirDormId, setDirDormId] = useState(dorms[0]?.id || '');
  useEffect(() => {
    if (dorms.length > 0 && (!dirDormId || !dorms.some((d) => d.id === dirDormId))) {
      setDirDormId(dorms[0].id);
    }
  }, [dorms, dirDormId]);
  const [dirItemTitle, setDirItemTitle] = useState('');
  const [dirItemId, setDirItemId] = useState('');
  const [dirQty, setDirQty] = useState(1);
  const [dirUnit, setDirUnit] = useState('عدد');
  const [dirReason, setDirReason] = useState('');
  const [dirUrgency, setDirUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal');
  const [dirModalError, setDirModalError] = useState('');

  // مودال ارجاع خرید به کارپرداز (از روی درخواست انبار یا ارجاع مستقیم/کسری)
  const [isReferProcModalOpen, setIsReferProcModalOpen] = useState(false);
  const [referFromWarehouseReq, setReferFromWarehouseReq] = useState<WarehouseRequest | null>(null);
  const [procItemTitle, setProcItemTitle] = useState('');
  const [procItemCode, setProcItemCode] = useState('');
  const [procInvItemId, setProcInvItemId] = useState('');
  const [procCategory, setProcCategory] = useState<InventoryItem['category']>('general');
  const [procQty, setProcQty] = useState<number>(1);
  const [procUnit, setProcUnit] = useState('عدد');
  const [procUrgency, setProcUrgency] = useState<'normal' | 'urgent' | 'emergency'>('urgent');
  const [procDormId, setProcDormId] = useState('');
  const [procAssignedStaffId, setProcAssignedStaffId] = useState('');
  const [procReason, setProcReason] = useState('');
  const [procModalError, setProcModalError] = useState('');

  // مودال تأیید تحویل کارپرداز و انتقال به موجودی انبار
  const [confirmProcTarget, setConfirmProcTarget] = useState<ProcurementRequest | null>(null);
  const [confirmTargetInvId, setConfirmTargetInvId] = useState('');
  const [confirmNewCode, setConfirmNewCode] = useState('');
  const [confirmNewCategory, setConfirmNewCategory] = useState<InventoryItem['category']>('general');
  const [confirmNewLocation, setConfirmNewLocation] = useState('انبار مرکزی');
  const [confirmNewMinStock, setConfirmNewMinStock] = useState<number>(5);
  const [confirmQty, setConfirmQty] = useState<number>(1);
  const [confirmUnitPrice, setConfirmUnitPrice] = useState<number>(0);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmModalError, setConfirmModalError] = useState('');

  // مودال رد / برگشت تحویل کارپرداز
  const [rejectProcTarget, setRejectProcTarget] = useState<ProcurementRequest | null>(null);
  const [rejectProcReason, setRejectProcReason] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // محاسبات شاخص‌ها
  const totalItemsCount = inventoryItems.length;
  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const lowStockItems = inventoryItems.filter((item) => item.quantity <= item.minStockLevel);
  const lowStockCount = lowStockItems.length;

  const readyToIssueCount = warehouseRequests.filter((r) => r.status === 'pending_warehouse').length;
  const awaitingWarehouseConfirmCount = procurementRequests.filter(
    (p) => p.status === 'delivered_to_warehouse' && !p.warehouseConfirmed
  ).length;
  const awaitingConfirmList = procurementRequests.filter(
    (p) => p.status === 'delivered_to_warehouse' && !p.warehouseConfirmed
  );

  // فیلتر درخواست‌ها
  const filteredRequests = warehouseRequests.filter((r) => {
    if (requestStatusFilter !== 'all' && r.status !== requestStatusFilter) return false;
    if (requestDormFilter !== 'all' && r.dormId !== requestDormFilter) return false;
    if (requestSearch.trim()) {
      const q = requestSearch.trim().toLowerCase();
      return (
        r.requestCode.toLowerCase().includes(q) ||
        r.itemTitle.toLowerCase().includes(q) ||
        r.dormName.toLowerCase().includes(q) ||
        (r.requestLocation || '').toLowerCase().includes(q) ||
        (r.requesterDepartment || '').toLowerCase().includes(q) ||
        r.requestedByStaffName.toLowerCase().includes(q) ||
        (r.taskTrackingCode || '').toLowerCase().includes(q) ||
        (r.procurementTrackingCode || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // فیلتر ارجاعات خرید کارپرداز
  const filteredProcurement = procurementRequests.filter((p) => {
    if (procStatusFilter !== 'all' && p.status !== procStatusFilter) return false;
    if (procSearch.trim()) {
      const q = procSearch.trim().toLowerCase();
      return (
        p.trackingCode.toLowerCase().includes(q) ||
        p.itemTitle.toLowerCase().includes(q) ||
        (p.itemCode || '').toLowerCase().includes(q) ||
        (p.warehouseRequestCode || '').toLowerCase().includes(q) ||
        (p.supplierName || '').toLowerCase().includes(q) ||
        (p.dormName || '').toLowerCase().includes(q)
      );
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

  // فیلتر کاردکس تراکنش‌ها
  const filteredTransactions = useMemo(() => {
    return inventoryTransactions.filter((t) => {
      if (txTypeFilter !== 'all' && t.type !== txTypeFilter) return false;
      if (txSearch.trim()) {
        const q = txSearch.trim().toLowerCase();
        return (
          t.itemName.toLowerCase().includes(q) ||
          t.itemCode.toLowerCase().includes(q) ||
          t.reason.toLowerCase().includes(q) ||
          (t.referenceCode || '').toLowerCase().includes(q) ||
          (t.dormName || '').toLowerCase().includes(q) ||
          t.actorName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventoryTransactions, txTypeFilter, txSearch]);

  // باز کردن مدال صدور کالا
  const handleOpenIssueModal = (req: WarehouseRequest) => {
    setIssuingRequest(req);
    setIssueQty(req.quantityRequested);
    setIssueModalError('');
    let defaultPrice = 0;
    if (req.inventoryItemId) {
      const found = inventoryItems.find((i) => i.id === req.inventoryItemId);
      if (found) defaultPrice = found.unitPrice;
    } else {
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
    setIssueModalError('');

    if (issueQty <= 0) {
      setIssueModalError('مقدار تحویلی باید بزرگ‌تر از صفر باشد.');
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
      showFeedback(`حواله ${issuingRequest.requestCode} با موفقیت صادر و از انبار کسر شد.`);
      setIssuingRequest(null);
      onRefreshData();
    } else {
      setIssueModalError(res.message || 'خطا در صدور حواله');
    }
  };

  // افزودن قلم جدید به انبار
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    setAddModalError('');
    if (!newCode.trim() || !newName.trim()) {
      setAddModalError('کد کالا و نام کالا الزامی است.');
      return;
    }

    const res = Storage.addInventoryItem(
      {
        code: newCode.trim(),
        name: newName.trim(),
        category: newCategory,
        categoryLabel: CATEGORY_LABELS[newCategory],
        quantity: Number(newQuantity) || 0,
        unit: newUnit.trim() || 'عدد',
        minStockLevel: Number(newMinLevel) || 5,
        unitPrice: Number(newUnitPrice) || 0,
        location: newLocation.trim() || 'انبار مرکزی',
      },
      { id: staff.id, name: staff.fullName }
    );

    if (res.success) {
      showFeedback(`کالای «${newName}» با موفقیت به انبار افزوده شد.`);
      setIsAddItemModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewQuantity(10);
      setNewLocation('');
      onRefreshData();
    } else {
      setAddModalError(res.message || 'خطا در ثبت کالا');
    }
  };

  // باز کردن مودال ویرایش مشخصات کالا
  const openEditInventoryModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditCode(item.code);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditUnit(item.unit);
    setEditMinLevel(item.minStockLevel);
    setEditQty(item.quantity);
    setEditPrice(item.unitPrice);
    setEditLocation(item.location || '');
    setEditModalError('');
  };

  const handleUpdateItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditModalError('');

    const res = Storage.updateInventoryItem(editingItem.id, {
      code: editCode.trim(),
      name: editName.trim(),
      category: editCategory,
      categoryLabel: CATEGORY_LABELS[editCategory],
      unit: editUnit.trim() || 'عدد',
      minStockLevel: Math.max(0, Number(editMinLevel) || 0),
      quantity: Math.max(0, Number(editQty) || 0),
      unitPrice: Math.max(0, Number(editPrice) || 0),
      location: editLocation.trim() || undefined,
      lastRestockedDate: new Date().toLocaleDateString('fa-IR'),
    });

    if (res.success) {
      showFeedback(`اطلاعات و موجودی کالای «${editName}» بروزرسانی شد.`);
      setEditingItem(null);
      onRefreshData();
    } else {
      setEditModalError(res.message || 'خطا در ویرایش کالا');
    }
  };

  // حذف قطعی کالا پس از تأیید مودال
  const handleConfirmDeleteItem = () => {
    if (!deleteTargetItem) return;
    const res = Storage.deleteInventoryItem(deleteTargetItem.id);
    if (res.success) {
      showFeedback(`کالای «${deleteTargetItem.name}» از انبار حذف شد.`);
      setDeleteTargetItem(null);
      onRefreshData();
    } else {
      showFeedback(res.message || 'خطا در حذف کالا', 'error');
    }
  };

  // باز کردن مودال ورودی / خروجی کالا
  const openAdjustModal = (item: InventoryItem, type: 'in' | 'out') => {
    setAdjustingItem(item);
    setAdjustType(type);
    setAdjustQty(1);
    setAdjustUnitPrice(item.unitPrice);
    setAdjustReason(type === 'in' ? 'ورود کالا / شارژ موجودی انبار' : 'خروج کالا از انبار جهت مصرف در سرا');
    setAdjustRefCode('');
    setAdjustDormName('');
    setAdjustError('');
  };

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    setAdjustError('');

    const res = Storage.adjustInventoryStock(adjustingItem.id, {
      type: adjustType,
      quantity: Number(adjustQty),
      unitPrice: Number(adjustUnitPrice),
      reason: adjustReason,
      referenceCode: adjustRefCode,
      dormName: adjustDormName,
      actorId: staff.id,
      actorName: staff.fullName,
    });

    if (res.success) {
      showFeedback(res.message);
      setAdjustingItem(null);
      onRefreshData();
    } else {
      setAdjustError(res.message || 'خطا در ثبت تراکنش انبار');
    }
  };

  // ثبت گروهی چندردیفه دستی
  const handleBulkRowsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBulkModalError('');
    const validRows = bulkRows.filter((r) => r.name.trim());
    if (validRows.length === 0) {
      setBulkModalError('لطفاً حداقل نام یک کالا را وارد نمایید.');
      return;
    }

    const mapped = validRows.map((r, idx) => ({
      code: r.code.trim().toUpperCase() || `INV-${Date.now().toString().slice(-4)}-${idx + 1}`,
      name: r.name.trim(),
      category: r.category,
      categoryLabel: CATEGORY_LABELS[r.category],
      quantity: Math.max(0, Number(r.quantity) || 0),
      unit: r.unit.trim() || 'عدد',
      minStockLevel: Math.max(0, Number(r.minStockLevel) || 2),
      unitPrice: Math.max(0, Number(r.unitPrice) || 0),
      location: r.location.trim() || 'انبار مرکزی',
    }));

    const res = Storage.bulkImportInventoryItems(mapped, { id: staff.id, name: staff.fullName }, bulkMode);
    if (res.success) {
      showFeedback(res.message);
      setIsBulkEntryModalOpen(false);
      setBulkRows([
        { code: '', name: '', category: 'general', quantity: 10, unit: 'عدد', minStockLevel: 3, unitPrice: 0, location: 'انبار مرکزی' },
      ]);
      onRefreshData();
    } else {
      setBulkModalError(res.message || 'خطا در ثبت گروهی لیست انبار');
    }
  };

  // خواندن فایل اکسل انبار
  const handleExcelInventoryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setExcelModalError('');
    try {
      const res = await parseInventoryExcel(file);
      setExcelPreviewItems(res.items);
      setExcelSkippedRows(res.skippedRows);
    } catch (err: any) {
      setExcelModalError(err?.message || 'خطا در خواندن فایل اکسل لیست کالاها');
    }
  };

  const handleConfirmExcelInventoryImport = () => {
    if (!excelPreviewItems || excelPreviewItems.length === 0) return;
    const res = Storage.bulkImportInventoryItems(
      excelPreviewItems.map((it) => ({
        ...it,
        categoryLabel: CATEGORY_LABELS[it.category],
      })),
      { id: staff.id, name: staff.fullName },
      excelImportMode
    );
    if (res.success) {
      showFeedback(res.message);
      setIsExcelInventoryModalOpen(false);
      setExcelPreviewItems(null);
      onRefreshData();
    } else {
      setExcelModalError(res.message || 'خطا در ورود لیست اکسل به انبار');
    }
  };

  // صدور مستقیم درخواست حواله توسط انباردار
  const handleDirectRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDirModalError('');
    if (!dirItemTitle.trim() || !dirDormId) {
      setDirModalError('انتخاب سرا و عنوان کالا الزامی است.');
      return;
    }

    const dormObj = dorms.find((d) => d.id === dirDormId);
    const dormName = dormObj ? dormObj.name : 'سرای دانشجویی';

    const res = Storage.createWarehouseRequest({
      dormId: dirDormId,
      dormName,
      requestedByStaffId: staff.id,
      requestedByStaffName: staff.fullName,
      requestedByRole: 'supervisor',
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
      setDirModalError(res.message || 'خطا در ثبت حواله مستقیم');
    }
  };

  // باز کردن مودال ارجاع به کارپرداز (از درخواست انبار، کالای انبار یا ارجاع جدید)
  const openReferToProcurement = (opts?: { warehouseReq?: WarehouseRequest; invItem?: InventoryItem }) => {
    setProcModalError('');
    if (opts?.warehouseReq) {
      const r = opts.warehouseReq;
      const matchedItem = r.inventoryItemId
        ? inventoryItems.find((i) => i.id === r.inventoryItemId)
        : inventoryItems.find((i) => i.name.trim() === r.itemTitle.trim());
      setReferFromWarehouseReq(r);
      setProcItemTitle(r.itemTitle);
      setProcItemCode(matchedItem?.code || '');
      setProcInvItemId(matchedItem?.id || r.inventoryItemId || '');
      setProcCategory(matchedItem?.category || 'general');
      setProcQty(r.quantityRequested);
      setProcUnit(r.unit);
      setProcUrgency(r.urgency);
      setProcDormId(r.dormId);
      setProcReason(`عدم موجودی کافی در انبار برای حواله ${r.requestCode} (${r.dormName}) - ${r.reason}`);
    } else if (opts?.invItem) {
      const it = opts.invItem;
      setReferFromWarehouseReq(null);
      setProcItemTitle(it.name);
      setProcItemCode(it.code);
      setProcInvItemId(it.id);
      setProcCategory(it.category);
      setProcQty(Math.max(it.minStockLevel * 2 - it.quantity, 5));
      setProcUnit(it.unit);
      setProcUrgency(it.quantity === 0 ? 'urgent' : 'normal');
      setProcDormId('');
      setProcReason(`کسری موجودی در انبار (موجودی فعلی: ${it.quantity} ${it.unit} از حداقل ${it.minStockLevel})`);
    } else {
      setReferFromWarehouseReq(null);
      setProcItemTitle('');
      setProcItemCode('');
      setProcInvItemId('');
      setProcCategory('general');
      setProcQty(1);
      setProcUnit('عدد');
      setProcUrgency('normal');
      setProcDormId('');
      setProcReason('ناموجود در انبار - ارجاع جهت خرید');
    }
    setProcAssignedStaffId(procurementStaffList[0]?.id || '');
    setIsReferProcModalOpen(true);
  };

  const handleReferProcurementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcModalError('');
    if (!procItemTitle.trim()) {
      setProcModalError('عنوان کالا جهت خرید الزامی است.');
      return;
    }

    const dormObj = dorms.find((d) => d.id === procDormId);
    const assignedProc = procurementStaffList.find((p) => p.id === procAssignedStaffId);

    const res = Storage.createProcurementRequest({
      warehouseRequestId: referFromWarehouseReq?.id,
      inventoryItemId: procInvItemId || undefined,
      itemTitle: procItemTitle.trim(),
      itemCode: procItemCode.trim() || undefined,
      category: procCategory,
      requestedQuantity: Math.max(1, Number(procQty) || 1),
      unit: procUnit.trim() || 'عدد',
      urgency: procUrgency,
      reason: procReason.trim() || 'عدم موجودی در انبار - ارجاع به کارپرداز',
      dormId: procDormId || undefined,
      dormName: dormObj?.name,
      referredByStaffId: staff.id,
      referredByStaffName: staff.fullName,
      assignedProcurementId: assignedProc?.id,
      assignedProcurementName: assignedProc?.fullName,
    });

    if (res.success) {
      showFeedback(res.message);
      setIsReferProcModalOpen(false);
      setReferFromWarehouseReq(null);
      onRefreshData();
    } else {
      setProcModalError(res.message || 'خطا در ارجاع خرید به کارپرداز');
    }
  };

  // باز کردن مودال تأیید تحویل کارپرداز و انتقال به انبار
  const openConfirmDeliveryModal = (p: ProcurementRequest) => {
    setConfirmProcTarget(p);
    setConfirmModalError('');
    const matched =
      (p.inventoryItemId && inventoryItems.find((i) => i.id === p.inventoryItemId)) ||
      (p.itemCode && inventoryItems.find((i) => i.code.toUpperCase() === p.itemCode!.toUpperCase())) ||
      inventoryItems.find((i) => i.name.trim() === p.itemTitle.trim());

    setConfirmTargetInvId(matched?.id || '');
    setConfirmNewCode(p.itemCode || '');
    setConfirmNewCategory(p.category || 'general');
    setConfirmNewLocation('انبار مرکزی');
    setConfirmNewMinStock(5);
    setConfirmQty(p.purchasedQuantity ?? p.requestedQuantity ?? 1);
    setConfirmUnitPrice(p.unitPrice ?? 0);
    setConfirmNotes('');
  };

  const handleConfirmDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmProcTarget) return;
    setConfirmModalError('');

    if (confirmQty <= 0) {
      setConfirmModalError('مقدار دریافتی باید بزرگ‌تر از صفر باشد.');
      return;
    }

    const res = Storage.confirmProcurementDeliveryToWarehouse(confirmProcTarget.id, {
      warehouseStaffId: staff.id,
      warehouseStaffName: staff.fullName,
      targetInventoryItemId: confirmTargetInvId || undefined,
      newItemCode: confirmNewCode.trim() || undefined,
      newItemCategory: confirmNewCategory,
      newItemLocation: confirmNewLocation.trim() || undefined,
      newItemMinStock: Number(confirmNewMinStock) || 5,
      confirmedQuantity: Number(confirmQty),
      unitPrice: Number(confirmUnitPrice),
      confirmNotes: confirmNotes.trim() || undefined,
    });

    if (res.success) {
      showFeedback(res.message);
      setConfirmProcTarget(null);
      onRefreshData();
    } else {
      setConfirmModalError(res.message || 'خطا در انتقال به موجودی انبار');
    }
  };

  const handleRejectDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectProcTarget) return;
    const res = Storage.rejectProcurementDeliveryByWarehouse(
      rejectProcTarget.id,
      rejectProcReason.trim() || 'مغایرت تعداد یا مشخصات هنگام تحویل در انبار',
      staff.fullName
    );
    if (res.success) {
      showFeedback(res.message);
      setRejectProcTarget(null);
      setRejectProcReason('');
      onRefreshData();
    } else {
      showFeedback(res.message || 'خطا در برگشت تحویل', 'error');
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

      {/* بنر سربرگ انبار */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {staff.photoUrl ? (
              <img
                src={staff.photoUrl}
                alt={staff.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg shrink-0"
              />
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-violet-300 shadow-inner">
                <Boxes className="w-9 h-9" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{staff.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/30 text-violet-200 border border-violet-400/30">
                  مدیریت انبار، کاردکس ورودی/خروجی و ارجاع به کارپرداز
                </span>
              </div>
              <p className="text-xs sm:text-sm text-violet-200/80 mt-1 max-w-2xl leading-relaxed">
                تنها مسئول انبار مجاز به تعریف، ورود لیست، ویرایش و تغییر موجودی انبار است. موارد ناموجود را می‌توانید به کارپرداز ارجاع و پس از تحویل تأیید نمایید.
              </p>
              <div className="flex items-center gap-4 text-[11px] text-violet-300/80 mt-2">
                <span>تلفن تماس: {staff.phone || staff.mobile || '-'}</span>
                <span>•</span>
                <span>وضعیت: فعال در سامانه</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setAddModalError('');
                setIsAddItemModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-violet-900/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت کالای جدید</span>
            </button>
            <button
              onClick={() => openReferToProcurement()}
              className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ارجاع خرید به کارپرداز</span>
            </button>
            <button
              onClick={() => {
                setDirModalError('');
                setIsDirectReqModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>حواله مستقیم</span>
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
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>راهنما (PDF)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* اعلان ویژه کالاهای تحویل‌شده کارپرداز در انتظار تأیید انبار */}
      {awaitingWarehouseConfirmCount > 0 && (
        <div
          onClick={() => setActiveTab('procurement')}
          className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-orange-100/70 transition shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-600 text-white animate-pulse">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-orange-950 dark:text-orange-100">
                {awaitingWarehouseConfirmCount} مورد خرید توسط کارپرداز «تحویل به انبار» اعلام شده و منتظر تأیید شماست
              </div>
              <div className="text-[11px] text-orange-700 dark:text-orange-300">
                برای تطبیق فیزیکی و انتقال قطعی به موجودی انبار کلیک کنید.
              </div>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold">
            مشاهده و تأیید تحویل‌ها
          </span>
        </div>
      )}

      {/* کارت‌های شاخص کلیدی انبار */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <Package className="w-4 h-4 text-violet-600" />
            <span>کل اقلام انبار</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalItemsCount}</div>
          <div className="text-[10px] text-slate-400">تنوع کالاهای موجودی</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>آماده تحویل حواله</span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{readyToIssueCount}</div>
          <div className="text-[10px] text-amber-600/80">تأییدشده سرپرست</div>
        </div>

        <div
          onClick={() => setActiveTab('procurement')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-orange-200 dark:border-orange-900/50 shadow-xs cursor-pointer hover:border-orange-400 transition"
        >
          <div className="text-[11px] text-orange-700 dark:text-orange-400 font-bold flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-orange-600" />
            <span>تحویل‌های منتظر تأیید</span>
          </div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-300 mt-1">
            {awaitingWarehouseConfirmCount}
          </div>
          <div className="text-[10px] text-orange-600/80">ارسالی از کارپرداز</div>
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
          <div className="text-[10px] text-rose-600/80">نیازمند ارجاع خرید</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>ارزش موجودی فعلی</span>
          </div>
          <div className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-1.5 truncate">
            {Number(totalInventoryValue).toLocaleString('fa-IR')} ریال
          </div>
          <div className="text-[10px] text-slate-400">جمع کل سرمایه‌ انبار</div>
        </div>
      </div>

      {/* منوی دسته‌بندی‌شده و بازشونده کارتابل انبار */}
      <CollapsibleMenuGrid<'requests' | 'procurement' | 'inventory' | 'transactions' | 'clearance'>
        activeKey={activeTab}
        onToggle={(key) => {
          if (key === 'inventory') setOnlyLowStock(false);
          setActiveTab((prev) => (prev === key ? null : key));
        }}
        onCloseActive={() => setActiveTab(null)}
        title="منوی بخش‌های کارتابل انبار و تجهیزات (برای باز یا بسته شدن کلیک کنید)"
        emptyPrompt="برای مشاهده هر بخش، روی دکمه مربوطه کلیک کنید. با کلیک مجدد همان بخش بسته می‌شود."
        categories={[
          {
            title: 'حواله‌ها و کارپردازی',
            items: [
              {
                id: 'requests',
                label: 'درخواست‌ها و حواله‌ها',
                subtitle: 'تأیید و صدور حواله کالا و تجهیزات',
                icon: <ClipboardList className="w-4 h-4" />,
                badge: warehouseRequests.length,
                badgeTone: 'indigo',
                activeClass: 'bg-violet-600 text-white border-violet-600 shadow-md',
              },
              {
                id: 'procurement',
                label: 'ارجاعات کارپرداز و تأیید تحویل',
                subtitle: 'پیگیری خریدها و ورود به انبار',
                icon: <ShoppingBag className="w-4 h-4" />,
                badge: awaitingWarehouseConfirmCount > 0 ? awaitingWarehouseConfirmCount : procurementRequests.length,
                badgeTone: awaitingWarehouseConfirmCount > 0 ? 'amber' : 'teal',
                activeClass: 'bg-orange-600 text-white border-orange-600 shadow-md',
              },
            ],
          },
          {
            title: 'موجودی، کاردکس و تسویه',
            items: [
              {
                id: 'inventory',
                label: 'لیست و موجودی کالاهای انبار',
                subtitle: 'مدیریت کالاها، نقطه سفارش و اکسل',
                icon: <Boxes className="w-4 h-4" />,
                badge: lowStockCount > 0 ? lowStockCount : inventoryItems.length,
                badgeTone: lowStockCount > 0 ? 'rose' : 'teal',
                activeClass: 'bg-violet-600 text-white border-violet-600 shadow-md',
              },
              {
                id: 'transactions',
                label: 'کاردکس ورودی و خروجی',
                subtitle: 'سوابق تمام تراکنش‌های انبار',
                icon: <History className="w-4 h-4" />,
                badge: inventoryTransactions.length,
                badgeTone: 'sky',
                activeClass: 'bg-violet-600 text-white border-violet-600 shadow-md',
              },
              {
                id: 'clearance',
                label: 'تسویه حساب فارغ‌التحصیلان',
                subtitle: 'بررسی اموال تحویلی و تأییدیه انبار',
                icon: <GraduationCap className="w-4 h-4" />,
                badge: Storage.getGraduationClearances().filter(
                  (c) =>
                    c.educationGateStatus === 'approved' &&
                    (c.units?.warehouse?.status || 'pending') === 'pending'
                ).length,
                badgeTone: 'rose',
                activeClass: 'bg-sky-700 text-white border-sky-700 shadow-md',
              },
            ],
          },
        ]}
      />

      {/* ========================================================= */}
      {/* تب ۱: کارتابل درخواست‌ها و حواله‌ها */}
      {/* ========================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
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
                همه ({warehouseRequests.length})
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
                onClick={() => setRequestStatusFilter('referred_to_procurement')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  requestStatusFilter === 'referred_to_procurement'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                ارجاع‌شده به کارپرداز ({warehouseRequests.filter((r) => r.status === 'referred_to_procurement').length})
              </button>
              <button
                onClick={() => setRequestStatusFilter('pending_supervisor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  requestStatusFilter === 'pending_supervisor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                در انتظار سرپرست ({warehouseRequests.filter((r) => r.status === 'pending_supervisor').length})
              </button>
              <button
                onClick={() => setRequestStatusFilter('issued')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  requestStatusFilter === 'issued'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                تحویل‌شده ({warehouseRequests.filter((r) => r.status === 'issued').length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={requestDormFilter}
                onChange={(e) => setRequestDormFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
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
                  placeholder="جستجوی کد حواله، کالا، کارپرداز..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium w-56"
                />
              </div>
            </div>
          </div>

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
                const isReferredProc = req.status === 'referred_to_procurement';

                const matchedInv = req.inventoryItemId
                  ? inventoryItems.find((i) => i.id === req.inventoryItemId)
                  : inventoryItems.find((i) => i.name.trim() === req.itemTitle.trim());

                return (
                  <div
                    key={req.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between ${
                      isIssued
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10'
                        : isReferredProc
                        ? 'border-orange-300 dark:border-orange-800 bg-orange-50/10'
                        : isReady
                        ? 'border-amber-400 dark:border-amber-700 ring-2 ring-amber-400/20'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
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
                          {req.urgency === 'emergency' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-700 text-white font-extrabold">
                              اضطراری
                            </span>
                          )}
                          {req.isCustomItem && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300/70">
                              قلم جدید (خارج از لیست)
                            </span>
                          )}
                        </div>

                        <div>
                          {isIssued ? (
                            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>تحویل شد</span>
                            </span>
                          ) : isReferredProc ? (
                            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-extrabold flex items-center gap-1 border border-orange-300">
                              <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                              <span>ارجاع به کارپرداز ({req.procurementTrackingCode || '-'})</span>
                            </span>
                          ) : isReady ? (
                            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold flex items-center gap-1 border border-amber-300">
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
                          <span className="font-semibold text-slate-500">موجودی فعلی انبار:</span>
                          {matchedInv ? (
                            <span
                              className={`font-extrabold ${
                                matchedInv.quantity < req.quantityRequested ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {matchedInv.quantity} {matchedInv.unit} ({matchedInv.code})
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold">ناموجود / ثبت‌نشده در کاتالوگ</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-500 shrink-0">حوزه / واحد:</span>
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 text-left">
                            {req.requesterDepartment ||
                              WAREHOUSE_REQUESTER_ROLE_LABELS[req.requestedByRole] ||
                              'سایر واحدها'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-500 shrink-0">محل درخواست / مصرف:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-left">
                            {req.requestLocation || req.dormName}
                          </span>
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
                          <strong>توضیحات و علت نیاز: </strong>
                          {req.reason}
                        </p>
                      )}

                      {isIssued && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 mb-2">
                          <div className="flex justify-between font-bold">
                            <span>مقدار تحویلی: {req.issuedQuantity} {req.unit}</span>
                            <span>هزینه کل: {Number(req.totalCost || 0).toLocaleString('fa-IR')} ریال</span>
                          </div>
                          <div className="text-[10px] text-emerald-700">تحویل‌دهنده: {req.issuedByStaffName} ({req.issuedAt})</div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400">
                        {isReady
                          ? 'تأیید شده سرپرست'
                          : isReferredProc
                          ? `در حال پیگیری کارپرداز (${req.procurementTrackingCode})`
                          : isIssued
                          ? 'حواله نهایی صادر شد'
                          : 'در انتظار بررسی'}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(isReady || isPendingSup) && (
                          <button
                            onClick={() => openReferToProcurement({ warehouseReq: req })}
                            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="ناموجود در انبار؟ ارجاع جهت خرید به کارپرداز"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>ارجاع به کارپرداز (خرید)</span>
                          </button>
                        )}

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
      {/* تب ۲: ارجاعات به کارپرداز و تأیید تحویل به انبار */}
      {/* ========================================================= */}
      {activeTab === 'procurement' && (
        <div className="space-y-5">
          {/* بخش تحویل‌های کارپرداز در انتظار تأیید مسئول انبار */}
          {awaitingConfirmList.length > 0 && (
            <div className="bg-orange-50/70 dark:bg-orange-950/30 rounded-3xl p-5 border-2 border-orange-300 dark:border-orange-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-orange-600 text-white">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-orange-950 dark:text-orange-100">
                      صف تأیید تحویل کالاهای خریداری‌شده توسط کارپرداز ({awaitingConfirmList.length} مورد)
                    </h3>
                    <p className="text-[11px] text-orange-800 dark:text-orange-300">
                      پس از تطبیق فیزیکی تعداد و مشخصات کالا، دکمه «تأیید و انتقال به موجودی انبار» را بزنید تا به انبار اضافه شود.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {awaitingConfirmList.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-orange-200 dark:border-orange-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-orange-100 text-orange-800">
                        {p.trackingCode}
                      </span>
                      <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300">
                        تحویل اعلام‌شده: {p.deliveredAt || p.updatedAt}
                      </span>
                    </div>

                    <div className="font-black text-sm text-slate-900 dark:text-white">{p.itemTitle}</div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl">
                      <div>
                        <span className="text-slate-400">مقدار خریداری‌شده: </span>
                        <strong className="text-emerald-700 dark:text-emerald-300">
                          {p.purchasedQuantity ?? p.requestedQuantity} {p.unit}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">تعداد اقلام/بسته: </span>
                        <strong>{p.purchasedItemCount ?? '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">قیمت واحد: </span>
                        <strong>{Number(p.unitPrice || 0).toLocaleString('fa-IR')} ریال</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">مبلغ کل: </span>
                        <strong>{Number(p.totalPrice || 0).toLocaleString('fa-IR')} ریال</strong>
                      </div>
                      {p.supplierName && (
                        <div className="col-span-2 text-[11px] text-slate-600 dark:text-slate-300">
                          فروشنده: {p.supplierName} {p.invoiceNumber ? `• فاکتور: ${p.invoiceNumber}` : ''}
                        </div>
                      )}
                    </div>

                    {p.procurementNotes && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                        یادداشت کارپرداز ({p.updatedByProcurementName}): {p.procurementNotes}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => openConfirmDeliveryModal(p)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>تأیید و انتقال به موجودی انبار</span>
                      </button>
                      <button
                        onClick={() => {
                          setRejectProcTarget(p);
                          setRejectProcReason('');
                        }}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>عدم تأیید / برگشت</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* فیلترها و دکمه ارجاع جدید */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { k: 'all', l: `همه (${procurementRequests.length})` },
                  { k: 'pending_purchase', l: 'در انتظار خرید' },
                  { k: 'purchasing', l: 'در حال خرید' },
                  { k: 'purchased', l: 'خریداری‌شده (عدم تحویل)' },
                  { k: 'delivered_to_warehouse', l: `تحویل کارپرداز (${awaitingWarehouseConfirmCount})` },
                  { k: 'warehouse_confirmed', l: 'واردشده به انبار' },
                  { k: 'cancelled', l: 'لغو شده' },
                ] as const
              ).map((f) => (
                <button
                  key={f.k}
                  onClick={() => setProcStatusFilter(f.k)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    procStatusFilter === f.k
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {f.l}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجوی کد، کالا، فروشنده..."
                  value={procSearch}
                  onChange={(e) => setProcSearch(e.target.value)}
                  className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-52"
                />
              </div>
              <button
                onClick={() => openReferToProcurement()}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ارجاع خرید جدید</span>
              </button>
            </div>
          </div>

          {/* جدول پیگیری تمام ارجاعات کارپرداز */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">کد خرید</th>
                    <th className="py-3 px-4 font-bold">شرح کالا / قطعه</th>
                    <th className="py-3 px-4 font-bold">درخواستی</th>
                    <th className="py-3 px-4 font-bold">خریداری‌شده / مبلغ</th>
                    <th className="py-3 px-4 font-bold">وضعیت کارپرداز و تحویل</th>
                    <th className="py-3 px-4 font-bold text-center">اقدام انبار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProcurement.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        موردی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredProcurement.map((p) => {
                      const badge = PROC_STATUS_LABELS[p.status] || PROC_STATUS_LABELS.pending_purchase;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-orange-700 dark:text-orange-300">
                              {p.trackingCode}
                            </span>
                            {p.warehouseRequestCode && (
                              <div className="text-[10px] text-slate-400 mt-0.5">حواله: {p.warehouseRequestCode}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{p.itemTitle}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {p.dormName ? `${p.dormName} • ` : ''}
                              ارجاع: {p.referredAt}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            {p.requestedQuantity} {p.unit}
                          </td>
                          <td className="py-3.5 px-4">
                            {p.purchasedQuantity !== undefined ? (
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {p.purchasedQuantity} {p.unit}
                                  {p.purchasedItemCount ? ` (${p.purchasedItemCount} قلم)` : ''}
                                </div>
                                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                                  {Number(p.totalPrice || 0).toLocaleString('fa-IR')} ریال
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border inline-block ${badge.cls}`}>
                              {badge.label}
                            </span>
                            {p.supplierName && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                فروشنده: {p.supplierName} {p.invoiceNumber ? `• ${p.invoiceNumber}` : ''}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {p.status === 'delivered_to_warehouse' && !p.warehouseConfirmed ? (
                              <button
                                onClick={() => openConfirmDeliveryModal(p)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                              >
                                تأیید و انتقال به انبار
                              </button>
                            ) : p.warehouseConfirmed ? (
                              <span className="text-[11px] font-bold text-emerald-600">انتقال‌یافته به انبار</span>
                            ) : (
                              <span className="text-[11px] text-slate-400">در دست کارپرداز</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* تب ۳: موجودی کالاها و قطعات انبار (اختصاصی کاربر انبار) */}
      {/* ========================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* نوار ابزار مدیریت انبار (فقط کاربر انبار) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setAddModalError('');
                  setIsAddItemModalOpen(true);
                }}
                className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت کالای تکی</span>
              </button>

              <button
                onClick={() => {
                  setBulkModalError('');
                  setIsBulkEntryModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                <span>ثبت لیستی مواد و وسایل</span>
              </button>

              <button
                onClick={() => {
                  setExcelModalError('');
                  setExcelPreviewItems(null);
                  setIsExcelInventoryModalOpen(true);
                }}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>ورود لیست با اکسل</span>
              </button>

              <button
                onClick={() => exportInventoryToExcel(inventoryItems, inventoryTransactions)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>خروجی اکسل انبار و کاردکس</span>
              </button>
            </div>

            <span className="text-[11px] font-semibold text-slate-500">
              تغییر موجودی از طریق دکمه‌های «+ ورودی» و «- خروجی» خودکار در کاردکس ثبت می‌شود
            </span>
          </div>

          {/* فیلترها و جستجوی کاتالوگ انبار */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { k: 'all', l: `همه (${inventoryItems.length})` },
                  { k: 'plumbing', l: 'لوله‌کشی و شیرآلات' },
                  { k: 'electrical', l: 'برق و روشنایی' },
                  { k: 'carpentry', l: 'نجاری و قفل' },
                  { k: 'cleaning', l: 'بهداشت و شوینده' },
                  { k: 'general', l: 'تجهیزات عمومی' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.k}
                  onClick={() => {
                    setInventoryCategoryFilter(cat.k);
                    setOnlyLowStock(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    inventoryCategoryFilter === cat.k && !onlyLowStock
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.l}
                </button>
              ))}
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
                className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium w-56"
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
                    <th className="py-3 px-4 font-bold">دسته‌بندی</th>
                    <th className="py-3 px-4 font-bold text-center">موجودی فعلی</th>
                    <th className="py-3 px-4 font-bold">حداقل هشدار</th>
                    <th className="py-3 px-4 font-bold">قیمت واحد (ریال)</th>
                    <th className="py-3 px-4 font-bold">قفسه / مکان</th>
                    <th className="py-3 px-4 font-bold text-center">ثبت ورودی/خروجی و مدیریت</th>
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
                              <span>کسری موجودی - نیاز به خرید</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {item.categoryLabel || CATEGORY_LABELS[item.category] || item.category}
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
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <button
                              onClick={() => openAdjustModal(item, 'in')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                              title="ثبت ورودی کالا به انبار"
                            >
                              <ArrowDownCircle className="w-3.5 h-3.5" />
                              <span>+ ورودی</span>
                            </button>
                            <button
                              onClick={() => openAdjustModal(item, 'out')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                              title="ثبت خروجی کالا از انبار"
                            >
                              <ArrowUpCircle className="w-3.5 h-3.5" />
                              <span>- خروجی</span>
                            </button>
                            <button
                              onClick={() => openReferToProcurement({ invItem: item })}
                              className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                              title="ارجاع خرید به کارپرداز"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              <span>خرید</span>
                            </button>
                            <button
                              onClick={() => openEditInventoryModal(item)}
                              className="p-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg transition cursor-pointer"
                              title="ویرایش مشخصات کالا"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetItem(item)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg transition cursor-pointer"
                              title="حذف کالا از انبار"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      {/* تب ۴: کاردکس ورودی و خروجی کالاها */}
      {/* ========================================================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setTxTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  txTypeFilter === 'all'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                همه گردش‌ها ({inventoryTransactions.length})
              </button>
              <button
                onClick={() => setTxTypeFilter('in')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  txTypeFilter === 'in'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <ArrowDownCircle className="w-3.5 h-3.5" />
                <span>ورودی‌ها ({inventoryTransactions.filter((t) => t.type === 'in').length})</span>
              </button>
              <button
                onClick={() => setTxTypeFilter('out')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  txTypeFilter === 'out'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                <span>خروجی‌ها ({inventoryTransactions.filter((t) => t.type === 'out').length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجو در کاردکس..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-52"
                />
              </div>
              <button
                onClick={() => exportInventoryToExcel(inventoryItems, inventoryTransactions)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>خروجی اکسل</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">تاریخ</th>
                    <th className="py-3 px-4 font-bold">نوع</th>
                    <th className="py-3 px-4 font-bold">کد / نام کالا</th>
                    <th className="py-3 px-4 font-bold text-center">مقدار گردش</th>
                    <th className="py-3 px-4 font-bold text-center">موجودی قبل ← بعد</th>
                    <th className="py-3 px-4 font-bold">شرح / بابت / سند</th>
                    <th className="py-3 px-4 font-bold">ثبت‌کننده</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        تراکنش ورودی یا خروجی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-[11px] text-slate-500">{tx.date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                              tx.type === 'in'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.type === 'out'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {tx.type === 'in' ? 'ورودی (+)' : tx.type === 'out' ? 'خروجی (-)' : 'تعدیل'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{tx.itemName}</div>
                          <div className="font-mono text-[10px] text-violet-600">{tx.itemCode}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-black">
                          <span className={tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.type === 'in' ? '+' : '-'}
                            {tx.quantity} {tx.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-[11px]">
                          <span className="text-slate-400">{tx.previousQuantity}</span>
                          <span className="mx-1">←</span>
                          <strong className="text-slate-800 dark:text-white">{tx.newQuantity}</strong> {tx.unit}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-700 dark:text-slate-300">{tx.reason}</div>
                          {(tx.referenceCode || tx.dormName) && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {tx.referenceCode ? `سند: ${tx.referenceCode}` : ''}
                              {tx.referenceCode && tx.dormName ? ' • ' : ''}
                              {tx.dormName || ''}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">{tx.actorName}</td>
                      </tr>
                    ))
                  )}
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
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {issueModalError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{issueModalError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmIssue} className="space-y-4 mt-4">
              <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-2xl border border-violet-100 text-xs space-y-1">
                <div className="font-bold text-violet-900 dark:text-violet-200">
                  شرح قلم: {issuingRequest.itemTitle}
                </div>
                <div className="text-violet-700 dark:text-violet-300">
                  متقاضی: {issuingRequest.requestedByStaffName}
                </div>
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
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
                  یادداشت و شماره رسید انبار
                </label>
                <textarea
                  rows={2}
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
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
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
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
                  <p className="text-xs text-slate-400">اختصاصی مسئول انبار</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addModalError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {addModalError}
              </div>
            )}

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
                  نام کامل کالا یا وسیله *
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: شیر اهرمی ظرفشویی"
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
                    min="0"
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
                    قفسه و موقعیت
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
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۳: ویرایش مشخصات کالا */}
      {/* ========================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                ویرایش مشخصات و موجودی: {editingItem.name}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editModalError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {editModalError}
              </div>
            )}

            <form onSubmit={handleUpdateItemSubmit} className="space-y-3 mt-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">کد کالا</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold dir-ltr text-left"
                    dir="ltr"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">دسته‌بندی</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="plumbing">لوله‌کشی و شیرآلات</option>
                    <option value="electrical">برق و روشنایی</option>
                    <option value="carpentry">نجاری و قفل</option>
                    <option value="cleaning">بهداشت و شوینده</option>
                    <option value="general">عمومی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">نام کالا</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">موجودی فعلی</label>
                  <input
                    type="number"
                    min="0"
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">واحد</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">حداقل هشدار</label>
                  <input
                    type="number"
                    min="0"
                    value={editMinLevel}
                    onChange={(e) => setEditMinLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">قیمت واحد (ریال)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">مکان در انبار</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۳ب: حذف کالا از انبار */}
      {/* ========================================================= */}
      {deleteTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
            <div className="flex items-center gap-3 text-rose-700 dark:text-rose-300">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm">حذف کالا از فهرست انبار</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از حذف کالای <strong>«{deleteTargetItem.name}» ({deleteTargetItem.code})</strong> با موجودی{' '}
              <strong>{deleteTargetItem.quantity} {deleteTargetItem.unit}</strong> اطمینان دارید؟
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDeleteItem}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                بله، حذف شود
              </button>
              <button
                onClick={() => setDeleteTargetItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۳ج: ثبت ورودی / خروجی موجودی (+ ورودی / - خروجی) */}
      {/* ========================================================= */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {adjustType === 'in' ? (
                  <ArrowDownCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ArrowUpCircle className="w-6 h-6 text-rose-600" />
                )}
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {adjustType === 'in' ? 'ثبت ورودی کالا به انبار (+)' : 'ثبت خروجی کالا از انبار (-)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {adjustingItem.code} • {adjustingItem.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adjustError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustStockSubmit} className="space-y-3.5 mt-4 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('in')}
                  className={`flex-1 py-2 rounded-xl font-bold border transition cursor-pointer ${
                    adjustType === 'in'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  + ورودی به انبار
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('out')}
                  className={`flex-1 py-2 rounded-xl font-bold border transition cursor-pointer ${
                    adjustType === 'out'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  - خروجی از انبار
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <span>موجودی فعلی: <strong>{adjustingItem.quantity} {adjustingItem.unit}</strong></span>
                <span className="font-black text-violet-700 dark:text-violet-300">
                  موجودی پس از ثبت:{' '}
                  {adjustType === 'in'
                    ? adjustingItem.quantity + (Number(adjustQty) || 0)
                    : Math.max(0, adjustingItem.quantity - (Number(adjustQty) || 0))}{' '}
                  {adjustingItem.unit}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مقدار {adjustType === 'in' ? 'ورودی' : 'خروجی'} ({adjustingItem.unit}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    قیمت واحد (ریال)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={adjustUnitPrice}
                    onChange={(e) => setAdjustUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شماره سند / فاکتور
                  </label>
                  <input
                    type="text"
                    placeholder="اختیاری"
                    value={adjustRefCode}
                    onChange={(e) => setAdjustRefCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سرای مصرف‌کننده
                  </label>
                  <select
                    value={adjustDormName}
                    onChange={(e) => setAdjustDormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="">انبار مرکزی / عمومی</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  علت و شرح تراکنش *
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white rounded-xl font-bold cursor-pointer ${
                    adjustType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  ثبت قطعی در کاردکس انبار
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۳د: ثبت لیستی مواد و وسایل (چندردیفه دستی) */}
      {/* ========================================================= */}
      {isBulkEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  ورود لیستی مواد و وسایل انبار (ثبت چندردیفه سریع)
                </h3>
                <p className="text-xs text-slate-400">
                  اقلام جدید اضافه و اقلام هم‌نام یا هم‌کد بر اساس حالت انتخابی بروزرسانی می‌شوند
                </p>
              </div>
              <button
                onClick={() => setIsBulkEntryModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkModalError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {bulkModalError}
              </div>
            )}

            <form onSubmit={handleBulkRowsSubmit} className="space-y-4 mt-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold">نحوه برخورد با کالاهای تکراری:</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={bulkMode === 'add_stock'}
                      onChange={() => setBulkMode('add_stock')}
                    />
                    <span>افزودن به موجودی فعلی (+ ورودی)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={bulkMode === 'merge'}
                      onChange={() => setBulkMode('merge')}
                    />
                    <span>تنظیم موجودی دقیق جدید</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setBulkRows((prev) => [
                      ...prev,
                      { code: '', name: '', category: 'general', quantity: 10, unit: 'عدد', minStockLevel: 3, unitPrice: 0, location: 'انبار مرکزی' },
                    ])
                  }
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن سطر جدید</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-600">
                    <tr>
                      <th className="p-2">کد کالا</th>
                      <th className="p-2">نام کالا / وسیله *</th>
                      <th className="p-2">دسته</th>
                      <th className="p-2">تعداد</th>
                      <th className="p-2">واحد</th>
                      <th className="p-2">قیمت واحد (ریال)</th>
                      <th className="p-2">قفسه</th>
                      <th className="p-2">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bulkRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="خودکار"
                            value={row.code}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, code: e.target.value } : r))
                              )
                            }
                            className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 dir-ltr text-left"
                            dir="ltr"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="نام کالا..."
                            value={row.name}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r))
                              )
                            }
                            className="w-44 px-2 py-1.5 rounded-lg border border-slate-200 font-bold"
                            required
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={row.category}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, category: e.target.value as any } : r))
                              )
                            }
                            className="px-2 py-1.5 rounded-lg border border-slate-200"
                          >
                            <option value="plumbing">لوله‌کشی</option>
                            <option value="electrical">برق</option>
                            <option value="carpentry">نجاری</option>
                            <option value="cleaning">بهداشت</option>
                            <option value="general">عمومی</option>
                          </select>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            min="0"
                            value={row.quantity}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, quantity: Number(e.target.value) } : r))
                              )
                            }
                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 font-bold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={row.unit}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, unit: e.target.value } : r))
                              )
                            }
                            className="w-16 px-2 py-1.5 rounded-lg border border-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={row.unitPrice}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, unitPrice: Number(e.target.value) } : r))
                              )
                            }
                            className="w-28 px-2 py-1.5 rounded-lg border border-slate-200"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={row.location}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, location: e.target.value } : r))
                              )
                            }
                            className="w-28 px-2 py-1.5 rounded-lg border border-slate-200"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          {bulkRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setBulkRows((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  ثبت و بروزرسانی لیست در انبار
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkEntryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۳هـ: ورود لیست مواد و وسایل از اکسل */}
      {/* ========================================================= */}
      {isExcelInventoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-teal-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    ورود و بروزرسانی لیست کالاهای انبار از فایل اکسل
                  </h3>
                  <p className="text-xs text-slate-400">اختصاصی مسئول انبار</p>
                </div>
              </div>
              <button
                onClick={() => setIsExcelInventoryModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {excelModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {excelModalError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs">
              <div>
                <div className="font-bold text-teal-900 dark:text-teal-200">دانلود قالب استاندارد اکسل کالاهای انبار</div>
                <div className="text-teal-700 dark:text-teal-400 text-[11px]">
                  ستون‌ها: کد کالا، نام کالا، دسته‌بندی، تعداد / موجودی، واحد، حداقل هشدار، قیمت واحد، محل نگهداری
                </div>
              </div>
              <button
                type="button"
                onClick={downloadInventoryTemplate}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>دانلود قالب اکسل</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
              <span className="font-bold">نحوه ثبت کالاهای موجود:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={excelImportMode === 'add_stock'}
                  onChange={() => setExcelImportMode('add_stock')}
                />
                <span>اضافه شدن به موجودی قبلی (ورودی انبار)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={excelImportMode === 'merge'}
                  onChange={() => setExcelImportMode('merge')}
                />
                <span>جایگزینی عدد موجودی (انبارگردانی)</span>
              </label>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center">
              <UploadCloud className="w-10 h-10 text-teal-600 mx-auto mb-2" />
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer">
                <span>انتخاب فایل اکسل کالاها (.xlsx / .csv)</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelInventoryFile}
                  className="hidden"
                />
              </label>
            </div>

            {excelPreviewItems && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-700">
                    پیش‌نمایش: {excelPreviewItems.length} قلم کالا آماده ثبت
                  </span>
                  {excelSkippedRows > 0 && (
                    <span className="text-amber-600">{excelSkippedRows} ردیف خالی نادیده گرفته شد</span>
                  )}
                </div>
                <div className="max-h-56 overflow-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2">کد</th>
                        <th className="p-2">نام کالا</th>
                        <th className="p-2">دسته</th>
                        <th className="p-2">مقدار</th>
                        <th className="p-2">واحد</th>
                        <th className="p-2">قیمت (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {excelPreviewItems.map((it, i) => (
                        <tr key={i}>
                          <td className="p-2 font-mono">{it.code}</td>
                          <td className="p-2 font-bold">{it.name}</td>
                          <td className="p-2">{CATEGORY_LABELS[it.category]}</td>
                          <td className="p-2 font-bold">{it.quantity}</td>
                          <td className="p-2">{it.unit}</td>
                          <td className="p-2">{Number(it.unitPrice).toLocaleString('fa-IR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmExcelInventoryImport}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    تأیید و ثبت در انبار
                  </button>
                  <button
                    onClick={() => setIsExcelInventoryModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {dirModalError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {dirModalError}
              </div>
            )}

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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مقدار *
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    فوریت
                  </label>
                  <select
                    value={dirUrgency}
                    onChange={(e) => setDirUrgency(e.target.value as any)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری</option>
                    <option value="emergency">اضطراری</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  محل مصرف و دلیل تحویل
                </label>
                <textarea
                  rows={2}
                  value={dirReason}
                  onChange={(e) => setDirReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  ثبت حواله آماده تحویل
                </button>
                <button
                  type="button"
                  onClick={() => setIsDirectReqModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۵: ارجاع خرید کالا به کارپرداز */}
      {/* ========================================================= */}
      {isReferProcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-orange-200 dark:border-orange-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-700">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ارجاع خرید کالا به کارپرداز
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {referFromWarehouseReq
                      ? `متصل به حواله انبار ${referFromWarehouseReq.requestCode}`
                      : 'ثبت درخواست خرید اقلام ناموجود یا کسری انبار'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReferProcModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {procModalError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {procModalError}
              </div>
            )}

            <form onSubmit={handleReferProcurementSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب از کاتالوگ انبار (در صورت موجود بودن نام کالا)
                </label>
                <select
                  value={procInvItemId}
                  onChange={(e) => {
                    setProcInvItemId(e.target.value);
                    const it = inventoryItems.find((i) => i.id === e.target.value);
                    if (it) {
                      setProcItemTitle(it.name);
                      setProcItemCode(it.code);
                      setProcCategory(it.category);
                      setProcUnit(it.unit);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 mb-2"
                >
                  <option value="">-- کالای جدید / درج دستی نام کالا --</option>
                  {inventoryItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.code} - {it.name} (موجودی: {it.quantity} {it.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="نام کالا یا قطعه مورد نیاز جهت خرید *"
                  value={procItemTitle}
                  onChange={(e) => setProcItemTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تعداد مورد نیاز *</label>
                  <input
                    type="number"
                    min="1"
                    value={procQty}
                    onChange={(e) => setProcQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">واحد</label>
                  <input
                    type="text"
                    value={procUnit}
                    onChange={(e) => setProcUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">فوریت خرید</label>
                  <select
                    value={procUrgency}
                    onChange={(e) => setProcUrgency(e.target.value as any)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری</option>
                    <option value="emergency">اضطراری</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">سرای مقصد (اختیاری)</label>
                  <select
                    value={procDormId}
                    onChange={(e) => setProcDormId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="">انبار مرکزی (عمومی)</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">کارپرداز مسئول</label>
                  <select
                    value={procAssignedStaffId}
                    onChange={(e) => setProcAssignedStaffId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="">همه کارپردازان (عمومی)</option>
                    {procurementStaffList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  دلیل ارجاع و مشخصات فنی مورد نیاز
                </label>
                <textarea
                  rows={2}
                  value={procReason}
                  onChange={(e) => setProcReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>ارسال به کارتابل کارپرداز</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReferProcModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۶: تأیید تحویل کارپرداز و انتقال به موجودی انبار */}
      {/* ========================================================= */}
      {confirmProcTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-300 dark:border-emerald-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    تأیید تحویل کارپرداز و انتقال به موجودی انبار
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {confirmProcTarget.trackingCode} • {confirmProcTarget.itemTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmProcTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {confirmModalError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {confirmModalError}
              </div>
            )}

            <form onSubmit={handleConfirmDeliverySubmit} className="space-y-3.5 mt-4 text-xs">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 text-[11px] space-y-1">
                <div>
                  اعلامی کارپرداز ({confirmProcTarget.updatedByProcurementName}):{' '}
                  <strong>
                    {confirmProcTarget.purchasedQuantity ?? confirmProcTarget.requestedQuantity} {confirmProcTarget.unit}
                  </strong>
                  {confirmProcTarget.purchasedItemCount ? ` (${confirmProcTarget.purchasedItemCount} قلم/بسته)` : ''}
                </div>
                <div>
                  فروشنده: {confirmProcTarget.supplierName || '-'} • شماره فاکتور: {confirmProcTarget.invoiceNumber || '-'}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مقصد انتقال در لیست کالاهای انبار
                </label>
                <select
                  value={confirmTargetInvId}
                  onChange={(e) => setConfirmTargetInvId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="">-- ایجاد کالای جدید در فهرست انبار --</option>
                  {inventoryItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      افزودن به: {it.code} - {it.name} (موجودی فعلی: {it.quantity} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              {!confirmTargetInvId && (
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block font-semibold mb-1">کد کالای جدید</label>
                    <input
                      type="text"
                      placeholder="اختیاری (خودکار)"
                      value={confirmNewCode}
                      onChange={(e) => setConfirmNewCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dir-ltr text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">دسته‌بندی</label>
                    <select
                      value={confirmNewCategory}
                      onChange={(e) => setConfirmNewCategory(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    >
                      <option value="plumbing">لوله‌کشی و شیرآلات</option>
                      <option value="electrical">برق و روشنایی</option>
                      <option value="carpentry">نجاری و قفل</option>
                      <option value="cleaning">بهداشت و شوینده</option>
                      <option value="general">عمومی</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">محل نگهداری</label>
                    <input
                      type="text"
                      value={confirmNewLocation}
                      onChange={(e) => setConfirmNewLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">حداقل هشدار</label>
                    <input
                      type="number"
                      min="0"
                      value={confirmNewMinStock}
                      onChange={(e) => setConfirmNewMinStock(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تعداد تأییدشده ورودی به انبار ({confirmProcTarget.unit}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={confirmQty}
                    onChange={(e) => setConfirmQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    قیمت واحد نهایی (ریال)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={confirmUnitPrice}
                    onChange={(e) => setConfirmUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  یادداشت تحویل‌گیرنده (مسئول انبار)
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: کالا سالم تحویل انبار و قفسه‌بندی شد"
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأیید قطعی و ورود به موجودی انبار</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmProcTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مودال ۷: عدم تأیید و برگشت تحویل به کارپرداز */}
      {/* ========================================================= */}
      {rejectProcTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <h3 className="font-extrabold text-sm text-rose-800 dark:text-rose-200">
              عدم تأیید تحویل و برگشت به کارپرداز ({rejectProcTarget.trackingCode})
            </h3>
            <form onSubmit={handleRejectDeliverySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">علت عدم تأیید تحویل *</label>
                <textarea
                  rows={3}
                  placeholder="مثلاً: مغایرت تعداد یا نقص فنی کالا هنگام تحویل به انبار..."
                  value={rejectProcReason}
                  onChange={(e) => setRejectProcReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  برگشت وضعیت به کارپرداز
                </button>
                <button
                  type="button"
                  onClick={() => setRejectProcTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'clearance' && (
        <GraduationClearanceReviewPanel
          unitRole="warehouse"
          reviewerId={staff.id}
          reviewerName={staff.fullName}
          settings={Storage.getSettings()}
          onDataChange={onRefreshData}
        />
      )}
    </div>
  );
};
