import React, { useMemo, useState } from 'react';
import { CurrentUser, Dormitory, WarehouseRequest, WarehouseRequesterRole } from '../types';
import { Storage, getEducationStaffRoleLabel, normalizePersianSearch } from '../utils/storage';
import {
  DEFAULT_WAREHOUSE_CATALOG,
  WAREHOUSE_CATALOG_CATEGORY_LABELS,
  WAREHOUSE_REQUESTER_ROLE_LABELS,
  WarehouseCatalogCategory,
} from '../utils/warehouseCatalog';
import {
  PackagePlus,
  X,
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  ShoppingBag,
  XCircle,
  MapPin,
  Building2,
  Layers,
  ClipboardList,
  AlertCircle,
  Send,
  ShieldCheck,
} from 'lucide-react';

interface WarehouseRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: NonNullable<CurrentUser>;
  dorms: Dormitory[];
  warehouseRequests: WarehouseRequest[];
  onSubmitted: () => void;
}

function resolveRequesterProfile(currentUser: NonNullable<CurrentUser>): {
  staffId: string;
  staffName: string;
  role: WarehouseRequesterRole;
  defaultDepartment: string;
} {
  if (currentUser.role === 'admin') {
    return {
      staffId: currentUser.username || 'admin',
      staffName: currentUser.name || 'مدیر کل سامانه',
      role: 'admin',
      defaultDepartment: WAREHOUSE_REQUESTER_ROLE_LABELS.admin,
    };
  }
  if (currentUser.role === 'supervisor') {
    return {
      staffId: currentUser.supervisor.id,
      staffName: currentUser.supervisor.fullName,
      role: 'supervisor',
      defaultDepartment: WAREHOUSE_REQUESTER_ROLE_LABELS.supervisor,
    };
  }
  if (currentUser.role === 'counselor') {
    return {
      staffId: currentUser.counselor.id,
      staffName: currentUser.counselor.fullName,
      role: 'counselor',
      defaultDepartment:
        currentUser.counselor.specialty || WAREHOUSE_REQUESTER_ROLE_LABELS.counselor,
    };
  }
  if (currentUser.role === 'maintenance') {
    return {
      staffId: currentUser.technician.id,
      staffName: currentUser.technician.fullName,
      role: 'maintenance',
      defaultDepartment:
        currentUser.technician.specialty || WAREHOUSE_REQUESTER_ROLE_LABELS.maintenance,
    };
  }
  if (currentUser.role === 'education') {
    const eduRoleLabel = getEducationStaffRoleLabel(currentUser.staff);
    return {
      staffId: currentUser.staff.id,
      staffName: `${currentUser.staff.fullName} (${eduRoleLabel})`,
      role: 'education',
      defaultDepartment:
        currentUser.staff.department ||
        (currentUser.staff.educationRole === 'department_head'
          ? 'گروه آموزشی'
          : WAREHOUSE_REQUESTER_ROLE_LABELS.education),
    };
  }
  if (currentUser.role === 'student') {
    return {
      staffId: currentUser.student.studentId,
      staffName: currentUser.student.fullName,
      role: 'supervisor',
      defaultDepartment: 'دانشجو',
    };
  }
  const staff = currentUser.staff;
  const roleKey = currentUser.role as WarehouseRequesterRole;
  const dept =
    ('department' in staff && staff.department) ||
    WAREHOUSE_REQUESTER_ROLE_LABELS[roleKey] ||
    'واحد اداری';
  return {
    staffId: staff.id,
    staffName: staff.fullName,
    role: roleKey,
    defaultDepartment: dept,
  };
}

export const WarehouseRequisitionModal: React.FC<WarehouseRequisitionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  dorms,
  warehouseRequests,
  onSubmitted,
}) => {
  const requester = useMemo(() => resolveRequesterProfile(currentUser), [currentUser]);

  const [activeTab, setActiveTab] = useState<'new' | 'my_requests'>('new');
  const [itemMode, setItemMode] = useState<'preset' | 'custom'>('preset');
  const [categoryFilter, setCategoryFilter] = useState<WarehouseCatalogCategory | 'all'>('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  // فیلدهای فرم درخواست
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [itemTitle, setItemTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<WarehouseCatalogCategory>('office');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('عدد');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal');
  const [department, setDepartment] = useState<string>(requester.defaultDepartment);
  const [selectedDormId, setSelectedDormId] = useState<string>('');
  const [requestLocation, setRequestLocation] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredCatalog = useMemo(() => {
    const q = normalizePersianSearch(catalogSearch);
    return DEFAULT_WAREHOUSE_CATALOG.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!q) return true;
      const hay = normalizePersianSearch(
        `${item.name} ${WAREHOUSE_CATALOG_CATEGORY_LABELS[item.category]} ${item.defaultUnit}`
      );
      return hay.includes(q);
    });
  }, [categoryFilter, catalogSearch]);

  // فقط درخواست‌های ثبت‌شده توسط خود این کاربر نمایش داده می‌شود (بدون دسترسی به انبار یا درخواست‌های دیگران)
  const myRequests = useMemo(() => {
    return warehouseRequests.filter((r) => r.requestedByStaffId === requester.staffId);
  }, [warehouseRequests, requester.staffId]);

  const myPendingCount = useMemo(
    () =>
      myRequests.filter(
        (r) =>
          r.status === 'pending_warehouse' ||
          r.status === 'pending_supervisor' ||
          r.status === 'referred_to_procurement'
      ).length,
    [myRequests]
  );

  if (!isOpen || currentUser.role === 'student' || currentUser.role === 'warehouse') return null;

  const handleSelectPresetItem = (presetId: string) => {
    const found = DEFAULT_WAREHOUSE_CATALOG.find((i) => i.id === presetId);
    if (!found) return;
    setSelectedPresetId(found.id);
    setItemTitle(found.name);
    setUnit(found.defaultUnit);
    setCustomCategory(found.category);
    setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanTitle = itemTitle.trim();
    const cleanDept = department.trim() || requester.defaultDepartment;
    const cleanLocation = requestLocation.trim();
    const cleanReason = reason.trim();

    if (!cleanTitle) {
      setFeedback({
        type: 'error',
        text:
          itemMode === 'preset'
            ? 'لطفاً یک قلم از فهرست پیش‌فرض انتخاب کنید یا به حالت «افزودن قلم جدید» بروید.'
            : 'لطفاً نام قلم درخواستی را وارد نمایید.',
      });
      return;
    }

    if (!cleanLocation) {
      setFeedback({
        type: 'error',
        text: 'لطفاً محل دقیق درخواست یا مصرف (ساختمان، سرا، اتاق یا دفتر) را مشخص نمایید.',
      });
      return;
    }

    if (!cleanReason) {
      setFeedback({
        type: 'error',
        text: 'لطفاً توضیحات و علت نیاز به قلم درخواستی را وارد نمایید.',
      });
      return;
    }

    const matchedDorm = selectedDormId ? dorms.find((d) => d.id === selectedDormId) : undefined;
    const combinedLocation = matchedDorm
      ? `${matchedDorm.name} — ${cleanLocation}`
      : cleanLocation;

    const categoryLabel = WAREHOUSE_CATALOG_CATEGORY_LABELS[customCategory];

    const res = Storage.createWarehouseRequest({
      dormId: matchedDorm?.id || 'general',
      dormName: combinedLocation,
      requesterDepartment: cleanDept,
      requestLocation: combinedLocation,
      requestedByStaffId: requester.staffId,
      requestedByStaffName: requester.staffName,
      requestedByRole: requester.role,
      itemTitle: cleanTitle,
      itemCategory: categoryLabel,
      isCustomItem: itemMode === 'custom',
      quantityRequested: Math.max(1, Number(quantity) || 1),
      unit: unit.trim() || 'عدد',
      reason: cleanReason,
      urgency,
    });

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setSelectedPresetId('');
      setItemTitle('');
      setQuantity(1);
      setUnit('عدد');
      setUrgency('normal');
      setRequestLocation('');
      setReason('');
      onSubmitted();
    } else {
      setFeedback({ type: 'error', text: res.message || 'خطا در ثبت درخواست انبار' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* سربرگ */}
        <div className="bg-gradient-to-l from-violet-700 via-purple-700 to-indigo-800 px-5 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-white/15 border border-white/25 shrink-0">
              <PackagePlus className="w-5 h-5 text-amber-200" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-sm sm:text-base truncate">
                ثبت درخواست اقلام از انبار ({requester.defaultDepartment})
              </h2>
              <p className="text-[11px] text-purple-100/90 mt-0.5 truncate">
                انتخاب از فهرست پیش‌فرض اقلام یا ثبت قلم جدید با ذکر محل درخواست و توضیحات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
            aria-label="بستن پنجره درخواست انبار"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* تب‌ها */}
        <div className="px-5 pt-3 pb-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'new'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>ثبت درخواست جدید</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my_requests')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'my_requests'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>پیگیری درخواست‌های من ({myRequests.length.toLocaleString('fa-IR')})</span>
              {myPendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {myPendingCount.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>بدون دسترسی به موجودی واقعی انبار (فهرست پیش‌فرض)</span>
          </div>
        </div>

        {/* بدنه قابل اسکرول */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {feedback && (
            <div
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'new' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* انتخاب نحوه تعیین قلم کالا */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-violet-600" />
                    <span>۱. انتخاب قلم کالا</span>
                  </span>
                  <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-slate-900 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setItemMode('preset');
                        if (!selectedPresetId) setItemTitle('');
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        itemMode === 'preset'
                          ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      انتخاب از لیست پیش‌فرض
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setItemMode('custom');
                        setSelectedPresetId('');
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        itemMode === 'custom'
                          ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      افزودن مورد جدید (خارج از لیست)
                    </button>
                  </div>
                </div>

                {itemMode === 'preset' ? (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCategoryFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          categoryFilter === 'all'
                            ? 'bg-violet-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        همه دسته‌ها
                      </button>
                      {(
                        Object.entries(WAREHOUSE_CATALOG_CATEGORY_LABELS) as Array<
                          [WarehouseCatalogCategory, string]
                        >
                      ).map(([catKey, catLabel]) => (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => setCategoryFilter(catKey)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            categoryFilter === catKey
                              ? 'bg-violet-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {catLabel}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder="جستجو در فهرست پیش‌فرض اقلام (مثلاً: کاغذ A4، تونر، لامپ، قفل، مایع دستشویی...)"
                        className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                      {filteredCatalog.map((item) => {
                        const isSelected = selectedPresetId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectPresetItem(item.id)}
                            className={`text-right px-3 py-2 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-violet-50 dark:bg-violet-950/60 border-violet-500 text-violet-900 dark:text-violet-100 ring-1 ring-violet-400/40'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-violet-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate">{item.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {WAREHOUSE_CATALOG_CATEGORY_LABELS[item.category]}
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 font-semibold">
                              {item.defaultUnit}
                            </span>
                          </button>
                        );
                      })}
                      {filteredCatalog.length === 0 && (
                        <div className="col-span-2 p-4 text-center text-slate-400 text-xs space-y-2">
                          <div>موردی با این عنوان در فهرست پیش‌فرض یافت نشد.</div>
                          <button
                            type="button"
                            onClick={() => {
                              setItemMode('custom');
                              setItemTitle(catalogSearch.trim());
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] cursor-pointer"
                          >
                            افزودن «{catalogSearch.trim() || 'قلم جدید'}» به‌صورت دستی
                          </button>
                        </div>
                      )}
                    </div>

                    {itemTitle && (
                      <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-extrabold text-violet-900 dark:text-violet-200">
                          قلم انتخاب‌شده: {itemTitle}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPresetId('');
                            setItemTitle('');
                          }}
                          className="text-rose-600 hover:underline font-bold cursor-pointer"
                        >
                          تغییر
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        عنوان قلم جدید (مورد خارج از لیست) *
                      </label>
                      <input
                        type="text"
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                        placeholder="مثلاً: کارتریج پرینتر HP 2055 یا میکروفون یقه ای..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        دسته‌بندی پیشنهادی
                      </label>
                      <select
                        value={customCategory}
                        onChange={(e) =>
                          setCustomCategory(e.target.value as WarehouseCatalogCategory)
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                      >
                        {(
                          Object.entries(WAREHOUSE_CATALOG_CATEGORY_LABELS) as Array<
                            [WarehouseCatalogCategory, string]
                          >
                        ).map(([k, lbl]) => (
                          <option key={k} value={k}>
                            {lbl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* تعداد، واحد و اولویت */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تعداد / مقدار مورد نیاز *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    واحد شمارش *
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="عدد، بسته، لیتر، متر..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اولویت نیاز
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) =>
                      setUrgency(e.target.value as 'normal' | 'urgent' | 'emergency')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری</option>
                    <option value="emergency">اضطراری</option>
                  </select>
                </div>
              </div>

              {/* حوزه و محل درخواست */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-violet-600" />
                    <span>حوزه / واحد درخواست‌کننده *</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سرای مرتبط (اختیاری)
                  </label>
                  <select
                    value={selectedDormId}
                    onChange={(e) => setSelectedDormId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  >
                    <option value="">-- ساختمان اداری / آموزشی / سایر --</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>محل دقیق درخواست / مصرف *</span>
                </label>
                <input
                  type="text"
                  value={requestLocation}
                  onChange={(e) => setRequestLocation(e.target.value)}
                  placeholder="مثلاً: ساختمان آموزش طبقه ۲ اتاق ۲۰۴، دفتر سرپرستی طبقه همکف، سالن مطالعه کتابخانه..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات، مشخصات فنی و علت نیاز *
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="علت درخواست، مشخصات دقیق‌تر یا زمان مورد نیاز را بنویسید..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  بستن
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال درخواست به انبار</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {myRequests.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">
                    هنوز درخواستی از انبار ثبت نکرده‌اید.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('new')}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer"
                  >
                    ثبت اولین درخواست
                  </button>
                </div>
              ) : (
                myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                          {req.requestCode}
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {req.itemTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-violet-700 dark:text-violet-300">
                          {req.quantityRequested} {req.unit}
                        </span>
                        {req.isCustomItem && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            قلم جدید
                          </span>
                        )}
                      </div>

                      <div>
                        {req.status === 'issued' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تحویل شده ({req.issuedQuantity ?? req.quantityRequested} {req.unit})</span>
                          </span>
                        ) : req.status === 'referred_to_procurement' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 text-[11px] font-extrabold">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>ارجاع به کارپرداز جهت خرید</span>
                          </span>
                        ) : req.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-extrabold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رد شده</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {req.status === 'pending_supervisor'
                                ? 'در انتظار تأیید سرپرست'
                                : 'در انتظار بررسی انبار'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        <strong>حوزه:</strong> {req.requesterDepartment || requester.defaultDepartment}
                      </span>
                      <span>
                        <strong>محل درخواست:</strong> {req.requestLocation || req.dormName}
                      </span>
                      <span>
                        <strong>تاریخ:</strong> {req.requestDate}
                      </span>
                    </div>

                    {req.reason && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <strong>توضیحات:</strong> {req.reason}
                      </div>
                    )}

                    {(req.warehouseNotes || req.supervisorNotes) && (
                      <div className="text-[11px] text-indigo-800 dark:text-indigo-200 bg-indigo-50/70 dark:bg-indigo-950/40 p-2 rounded-xl border border-indigo-200/70 dark:border-indigo-800/70">
                        <strong>پاسخ / یادداشت:</strong> {req.warehouseNotes || req.supervisorNotes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
