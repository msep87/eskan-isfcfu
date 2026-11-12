import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Student } from '../types';
import { Storage } from '../utils/storage';
import {
  User,
  Upload,
  Camera,
  Save,
  X,
  Phone,
  MapPin,
  Heart,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  FileText,
  Activity,
  Home,
  Lock,
  Sparkles,
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onProfileUpdated: (updatedStudent: Student) => void;
  isFirstLoginForce?: boolean;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  onProfileUpdated,
  isFirstLoginForce = false,
}) => {
  const [formData, setFormData] = useState<Student>({
    ...student,
    postalAddress: student.postalAddress || '',
    customFields: { ...(student.customFields || {}) },
  });

  const [bloodGroup, setBloodGroup] = useState<string>(
    String(student.customFields?.['گروه خونی'] || 'O+')
  );
  const [specialCondition, setSpecialCondition] = useState<string>(
    String(student.customFields?.['بیماری خاص'] || 'ندارد')
  );

  const [termsAccepted, setTermsAccepted] = useState(true);
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomVal, setNewCustomVal] = useState('');
  const [photoPreview, setPhotoPreview] = useState(student.photoUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('حجم تصویر نباید بیشتر از ۳ مگابایت باشد.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPhotoPreview(base64);
        setFormData((prev) => ({ ...prev, photoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomField = () => {
    if (!newCustomKey.trim()) return;
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [newCustomKey.trim()]: newCustomVal.trim(),
      },
    }));
    setNewCustomKey('');
    setNewCustomVal('');
  };

  const handleRemoveCustomField = (key: string) => {
    setFormData((prev) => {
      const nextCustom = { ...(prev.customFields || {}) };
      delete nextCustom[key];
      return { ...prev, customFields: nextCustom };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // اعتبارسنجی دقیق فیلدهای الزامی پرونده دانشجو
    const cleanMobile = (formData.mobile || '').replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setValidationError('شماره تلفن همراه معتبر دانشجو الزامی است (مثال: 09131234567).');
      return;
    }

    if (!formData.emergencyPhone || formData.emergencyPhone.trim().length < 8) {
      setValidationError('شماره تماس اضطراری جهت موارد ضروری و پزشکی الزامی می‌باشد.');
      return;
    }

    if (!formData.parentPhone || formData.parentPhone.trim().length < 8) {
      setValidationError('شماره تماس والدین / ولی دانشجو الزامی است.');
      return;
    }

    if (!formData.fatherName || formData.fatherName.trim().length < 2) {
      setValidationError('نام پدر دانشجو الزامی است.');
      return;
    }

    if (!formData.province || formData.province.trim().length < 2) {
      setValidationError('استان محل سکونت الزامی است.');
      return;
    }

    if (!formData.city || formData.city.trim().length < 2) {
      setValidationError('شهر محل سکونت الزامی است.');
      return;
    }

    if (!formData.postalAddress || formData.postalAddress.trim().length < 5) {
      setValidationError('نشانی دقیق پستی و محل سکونت دانشجو جهت تکمیل پرونده الزامی است.');
      return;
    }

    if (!termsAccepted) {
      setValidationError('جهت تکمیل پرونده، تأیید صحت اطلاعات و تعهدنامه انضباطی الزامی است.');
      return;
    }

    const updatedCustomFields = {
      ...(formData.customFields || {}),
      'گروه خونی': bloodGroup || 'ثبت نشده',
      'بیماری خاص': specialCondition || 'ندارد',
    };

    const updated: Student = {
      ...formData,
      isProfileCompleted: true,
      customFields: updatedCustomFields,
      photoUrl: photoPreview || formData.photoUrl,
    };

    Storage.updateStudentProfile(student.studentId, updated);
    onProfileUpdated(updated);
    setSaveSuccess(true);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        // جلوگیری از بسته شدن هنگام کلیک روی پس‌زمینه در حالت اجباری
        if (!isFirstLoginForce && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[92vh] overflow-y-auto">
        
        {/* دکمه بستن تنها در صورتی که تکمیل پرونده اجباری نباشد */}
        {!isFirstLoginForce && (
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* سربرگ مدال */}
        <div className="flex items-start gap-3.5 border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
            {isFirstLoginForce ? <ShieldCheck className="w-7 h-7" /> : <User className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {isFirstLoginForce ? 'تکمیل الزامی اطلاعات پرونده اسکان دانشجو' : 'ویرایش پرونده و اطلاعات فردی'}
              </h2>
              {isFirstLoginForce && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold text-[11px] border border-rose-300 dark:border-rose-800 animate-pulse">
                  الزامی جهت ورود و اسکان
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isFirstLoginForce
                ? 'دانشجومعلم گرامی؛ بر اساس ضوابط اسکان دانشگاه فرهنگیان، تکمیل مشخصات تماس، نشانی و وضعیت سلامت در بدو ورود الزامی می‌باشد.'
                : 'بروزرسانی مشخصات تماس، عکس پرسنلی، نشانی و پرونده سلامت دانشجو'}
            </p>
          </div>
        </div>

        {/* بنر اخطار موظف بودن در اولین ورود */}
        {isFirstLoginForce && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-sm">توجه: دسترسی به انتخاب اتاق و خدمات سراها منوط به تکمیل این فرم است</div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                لطفاً تمامی فیلدهای ستاره‌دار (*) را با دقت کامل تکمیل و تأیید نمایید. پس از ثبت موفق، دسترسی شما به انتخاب تخت روی نقشه بصری بلافاصله فعال خواهد شد.
              </div>
            </div>
          </div>
        )}

        {/* پیام‌های خطا یا موفقیت */}
        {validationError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-bold">{validationError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <div className="font-bold text-sm">پرونده شما با موفقیت تکمیل و ثبت گردید!</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                هم‌اکنون دسترسی به تمامی امکانات سامانه و انتخاب اتاق برای شما فعال است.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* بخش اول: بارگذاری و تأیید عکس پرسنلی */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={student.fullName}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-teal-500 shadow-md"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md"
                  style={{ backgroundColor: student.avatarColor || '#0d9488' }}
                >
                  {student.fullName.slice(0, 2)}
                </div>
              )}
              <label
                htmlFor="photoUploadInputModal"
                className="absolute -bottom-2 -left-2 p-2 rounded-xl bg-teal-600 text-white shadow-md hover:bg-teal-700 cursor-pointer transition"
                title="بارگذاری / تغییر عکس"
              >
                <Camera className="w-4 h-4" />
              </label>
              <input
                id="photoUploadInputModal"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-right flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  تصویر پرسنلی جهت کارت دانشجویی و سامانه خوابگاه
                </h4>
                {photoPreview && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    بارگذاری شده
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                این عکس در کارت دانشجویی، داشبورد اختصاصی و لیست اتاق نمایش داده می‌شود. (فرمت JPG یا PNG، حداکثر ۳ مگابایت)
              </p>
              <label
                htmlFor="photoUploadInputModal"
                className="inline-flex items-center gap-1.5 mt-2.5 px-3.5 py-1.5 rounded-xl border border-teal-400 dark:border-teal-700 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{photoPreview ? 'تغییر عکس پرسنلی' : 'بارگذاری فایل عکس پرسنلی'}</span>
              </label>
            </div>
          </div>

          {/* بخش دوم: اطلاعات هویتی و دانشگاهی (ثابت و تأیید شده) */}
          <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300 mb-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>مشخصات آموزشی و شناسنامه‌ای (ثبت شده در سامانه گلستان):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">نام و نام خانوادگی:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{student.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">شماره دانشجویی:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{student.studentId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">کد ملی:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{student.nationalId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">رشته و ترم ورود:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {student.fieldOfStudy} ({student.entryTerm})
                </span>
              </div>
            </div>
          </div>

          {/* بخش سوم: اطلاعات فردی و شناسنامه‌ای پایه */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-600" />
              <span>اطلاعات فردی و شناسنامه‌ای</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام پدر *
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="نام پدر"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ تولد *
                </label>
                <input
                  type="text"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  placeholder="مثلاً 1383/05/15"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 dir-ltr text-left"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  دین و مذهب *
                </label>
                <input
                  type="text"
                  value={formData.religion || 'اسلام / شیعه'}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  placeholder="اسلام / شیعه"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* بخش چهارم: اطلاعات تماس و شماره‌های اضطراری */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-teal-600" />
              <span>اطلاعات تماس و تلفن‌های اضطراری (الزامی)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شماره همراه دانشجو *
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="0913xxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 dir-ltr text-left"
                  dir="ltr"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">جهت دریافت پیامک‌ها و اطلاعیه‌های خوابگاه</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شماره تماس اضطراری (اورژانس و حوادث) *
                </label>
                <input
                  type="text"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="0913xxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 dir-ltr text-left"
                  dir="ltr"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">فردی از نزدیکان در مواقع حوادث یا اورژانس</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شماره تماس والدین / ولی *
                </label>
                <input
                  type="text"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="0913xxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 dir-ltr text-left"
                  dir="ltr"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">جهت هماهنگی‌های سرپرستی خوابگاه با خانواده</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تلفن ثابت منزل (اختیاری)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="031xxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 dir-ltr text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* بخش پنجم: نشانی و محل سکونت */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>محل سکونت و نشانی دقیق</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  استان محل سکونت *
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="مثلاً اصفهان، یزد، چهارمحال و بختیاری..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شهر / شهرستان محل سکونت *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="مثلاً کاشان، نجف‌آباد، شهرکرد..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-teal-600" />
                <span>نشانی دقیق پستی محل سکونت خانواده *</span>
              </label>
              <textarea
                rows={2}
                value={formData.postalAddress}
                onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                placeholder="خیابان، کوچه، پلاک، طبقه و کد پستی ده‌رقمی منزل..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          {/* بخش ششم: پرونده سلامت، گروه خونی و سوابق پزشکی */}
          <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-600" />
              <span>پرونده سلامت، گروه خونی و ملاحظات پزشکی (جهت مراقبت‌های اورژانسی)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  گروه خونی *
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="O+">O+ (او مثبت)</option>
                  <option value="A+">A+ (آ مثبت)</option>
                  <option value="B+">B+ (ب مثبت)</option>
                  <option value="AB+">AB+ (آ ب مثبت)</option>
                  <option value="O-">O- (او منفی)</option>
                  <option value="A-">A- (آ منفی)</option>
                  <option value="B-">B- (ب منفی)</option>
                  <option value="AB-">AB- (آ ب منفی)</option>
                  <option value="ثبت نشده">نامشخص / ثبت نشده</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  بیماری خاص، آلرژی یا داروی خاص *
                </label>
                <input
                  type="text"
                  value={specialCondition}
                  onChange={(e) => setSpecialCondition(e.target.value)}
                  placeholder="در صورت عدم ابتلا بنویسید «ندارد»"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* بخش هفتم: فیلدهای سفارشی و پویا (علایق، فعالیت‌ها و ویژگی‌ها) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-500" />
                <span>اطلاعات تکمیلی، علایق فرهنگی و ورزشی (فیلدهای پویا)</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {Object.entries(formData.customFields || {})
                .filter(([k]) => k !== 'گروه خونی' && k !== 'بیماری خاص')
                .map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex-1 mr-2">
                      <span className="text-[11px] text-slate-400 block">{key}:</span>
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customFields: {
                              ...(prev.customFields || {}),
                              [key]: e.target.value,
                            },
                          }))
                        }
                        className="w-full bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(key)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      title="حذف این فیلد"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>

            {/* افزودن فیلد سفارشی جدید */}
            <div className="p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-dashed border-teal-200 dark:border-teal-800/60">
              <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 block mb-2">
                افزودن مشخصه یا مهارت جدید (مثلاً رشته ورزشی، حافظ قرآن، ساز موسیقی، علایق پژوهشی):
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="عنوان مشخصه (مثلاً رشته ورزشی)"
                  value={newCustomKey}
                  onChange={(e) => setNewCustomKey(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-teal-500"
                />
                <input
                  type="text"
                  placeholder="توضیح یا مهارت (مثلاً فوتسال)"
                  value={newCustomVal}
                  onChange={(e) => setNewCustomVal(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ثبت</span>
                </button>
              </div>
            </div>
          </div>

          {/* تعهدنامه صحت اطلاعات و منشور اخلاقی خوابگاه */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                اینجانب <strong>{student.fullName}</strong> صحت کلیه اطلاعات مندرج در این پرونده را تأیید نموده و متعهد می‌گردم کلیه ضوابط، مقررات انضباطی و شئونات اسلامی سراهای دانشجویی دانشگاه فرهنگیان را به دقت رعایت نمایم.
              </span>
            </label>
          </div>

          {/* دکمه‌های فرم */}
          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-600/25 transition cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <Save className="w-4 h-4" />
              <span>{isFirstLoginForce ? 'تکمیل اطلاعات و فعال‌سازی حساب کاربری' : 'ذخیره تغییرات پرونده'}</span>
            </button>
            {!isFirstLoginForce && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                انصراف
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
