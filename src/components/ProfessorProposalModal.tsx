import React, { useEffect, useMemo, useState } from 'react';
import {
  SchedEmploymentType,
  SchedProfessorProposal,
  SchedWorkspaceRole,
} from '../types';
import { Storage } from '../utils/storage';
import {
  SCHED_EMPLOYMENT_LABELS,
  getNextTemporaryProfessorCode,
  isTemporaryProfessorCode,
  normalizeProfessorCodeInput,
  normalizeSchedCode,
} from '../utils/schedulingUtils';
import {
  AlertCircle,
  CheckCircle2,
  Send,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';

interface ProfessorProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: { id: string; name: string };
  userRole: SchedWorkspaceRole;
  allowedMajorNames?: string[];
  onSubmitted?: (proposal: SchedProfessorProposal) => void;
}

export const ProfessorProposalModal: React.FC<ProfessorProposalModalProps> = ({
  isOpen,
  onClose,
  actor,
  userRole,
  allowedMajorNames = [],
  onSubmitted,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [proposedCode, setProposedCode] = useState('');
  const [gender, setGender] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('');
  const [degreeField, setDegreeField] = useState('');
  const [degreeSpecialization, setDegreeSpecialization] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [unitCenterName, setUnitCenterName] = useState('');
  const [employmentType, setEmploymentType] = useState<SchedEmploymentType>('haghol_tadris_free');
  const [employmentStatusRaw, setEmploymentStatusRaw] = useState('');
  const [academicRank, setAcademicRank] = useState('');
  const [academicStep, setAcademicStep] = useState('');
  const [mobile, setMobile] = useState('');
  const [landlinePhone, setLandlinePhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const suggestedTempCode = useMemo(() => {
    if (!isOpen) return 'new001';
    return (
      getNextTemporaryProfessorCode(
        Storage.getSchedProfessors(),
        Storage.getSchedProfessorProposals()
      ) || ''
    );
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setFirstName('');
    setLastName('');
    setNationalId('');
    setProposedCode(suggestedTempCode || 'new001');
    setGender('');
    setFatherName('');
    setDegreeLevel('');
    setDegreeField('');
    setDegreeSpecialization('');
    setDepartmentName(allowedMajorNames.length === 1 ? allowedMajorNames[0] : '');
    setUnitCenterName('');
    setEmploymentType('haghol_tadris_free');
    setEmploymentStatusRaw('');
    setAcademicRank('');
    setAcademicStep('');
    setMobile('');
    setLandlinePhone('');
    setBankName('');
    setBankAccount('');
    setNotes('');
    setErrorMsg('');
  }, [isOpen, suggestedTempCode, allowedMajorNames]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanNat = normalizeSchedCode(nationalId);
    if (!cleanFirst || !cleanLast) {
      setErrorMsg('لطفاً نام و نام خانوادگی استاد جدید را به صورت کامل وارد کنید.');
      return;
    }
    if (!cleanNat || cleanNat.length < 8) {
      setErrorMsg('کد ملی استاد باید معتبر باشد (این کد به عنوان رمز عبور پیش‌فرض استاد نیز استفاده می‌شود).');
      return;
    }

    const res = Storage.submitSchedProfessorProposal({
      requestedById: actor.id,
      requestedByName: actor.name,
      requestedByRole: userRole,
      requestedByFields: allowedMajorNames.length > 0 ? allowedMajorNames : undefined,
      proposedProfessorCode: normalizeProfessorCodeInput(proposedCode) || suggestedTempCode || undefined,
      firstName: cleanFirst,
      lastName: cleanLast,
      fullName: `${cleanFirst} ${cleanLast}`.trim(),
      gender: gender.trim() || undefined,
      fatherName: fatherName.trim() || undefined,
      nationalId: cleanNat,
      departmentName: departmentName.trim() || undefined,
      unitCenterName: unitCenterName.trim() || undefined,
      degreeLevel: degreeLevel.trim() || undefined,
      degreeField: degreeField.trim() || undefined,
      degreeSpecialization: degreeSpecialization.trim() || undefined,
      academicStep: normalizeSchedCode(academicStep) || academicStep.trim() || undefined,
      academicRank: academicRank.trim() || undefined,
      employmentType,
      employmentStatusRaw: employmentStatusRaw.trim() || undefined,
      mobile: normalizeSchedCode(mobile) || undefined,
      landlinePhone: normalizeSchedCode(landlinePhone) || undefined,
      bankName: bankName.trim() || undefined,
      bankAccount: normalizeSchedCode(bankAccount) || undefined,
      notes: notes.trim() || undefined,
    });

    if (!res.success || !res.proposal) {
      setErrorMsg(res.message);
      return;
    }
    onSubmitted?.(res.proposal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                فرم درخواست ثبت استاد جدید (ارسال به مدیر سامانه)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                پس از بررسی و تأیید مدیر کل سامانه، استاد با کد موقت (new001 تا new999) یا کد گلستان به سامانه اضافه می‌شود.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* کادر کد موقت new001 تا new999 */}
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>کد استاد (موقت از new001 تا new999 یا کد مشخصه گلستان)</span>
              </span>
              {suggestedTempCode && (
                <button
                  type="button"
                  onClick={() => setProposedCode(suggestedTempCode)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer"
                >
                  استفاده از کد موقت پیشنهادی ({suggestedTempCode})
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <label className="space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  کد پیشنهادی استاد
                </span>
                <input
                  type="text"
                  value={proposedCode}
                  onChange={(e) => setProposedCode(e.target.value)}
                  placeholder="مثلاً: new001 یا کد گلستان"
                  className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-mono font-bold"
                  dir="ltr"
                />
              </label>
              <div className="text-[11px] text-indigo-800 dark:text-indigo-200 leading-relaxed">
                {isTemporaryProfessorCode(proposedCode) ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    کد موقت استاندارد انتخاب شده است؛ پس از صدور کد در سامانه گلستان، مدیر سامانه می‌تواند آن را اصلاح کند.
                  </span>
                ) : (
                  <span>
                    در صورت نداشتن کد گلستان، کدهای موقت <span className="font-mono font-bold">new001</span> تا{' '}
                    <span className="font-mono font-bold">new999</span> به صورت خودکار پیشنهاد می‌شوند و بعداً قابل اصلاح هستند.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="font-bold">نام استاد *</span>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="مثلاً: علی"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold">نام خانوادگی استاد *</span>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="مثلاً: محمدی"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold">شماره ملی *</span>
              <input
                type="text"
                required
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="۱۰ رقم کد ملی"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                dir="ltr"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="font-bold">جنس</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="">-- انتخاب --</option>
                <option value="مرد">مرد</option>
                <option value="زن">زن</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-bold">نام پدر</span>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold">تلفن همراه *</span>
              <input
                type="text"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="0913..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                dir="ltr"
              />
            </label>
          </div>

          <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-extrabold text-teal-900 dark:text-teal-200">
                مدرک و رشته تحصیلی استاد
              </span>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                (رشته مدرک اساتید آزاد و مستثنی از رشته‌های مصوب دانشگاه است)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="font-bold">مقطع تحصیلی</span>
                <input
                  type="text"
                  list="proposal-prof-degree-levels"
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                  placeholder="مثلاً: دکتری تخصصی"
                  className="w-full px-3 py-2 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900"
                />
                <datalist id="proposal-prof-degree-levels">
                  <option value="دکتری تخصصی" />
                  <option value="دکتری" />
                  <option value="دانشجوی دکتری" />
                  <option value="کارشناسی ارشد" />
                  <option value="کارشناسی" />
                  <option value="حوزوی سطح ۳" />
                  <option value="حوزوی سطح ۴" />
                </datalist>
              </label>
              <label className="space-y-1">
                <span className="font-bold">رشته تحصیلی</span>
                <input
                  type="text"
                  value={degreeField}
                  onChange={(e) => setDegreeField(e.target.value)}
                  placeholder="مثلاً: برنامه‌ریزی درسی"
                  className="w-full px-3 py-2 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold">گرایش تحصیلی (اختیاری)</span>
                <input
                  type="text"
                  value={degreeSpecialization}
                  onChange={(e) => setDegreeSpecialization(e.target.value)}
                  placeholder="مثلاً: آموزش ابتدایی"
                  className="w-full px-3 py-2 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="font-bold">گروه آموزشی مرتبط</span>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="مثلاً: علوم تربیتی / آموزش ابتدایی"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold">واحد / مرکز</span>
              <input
                type="text"
                value={unitCenterName}
                onChange={(e) => setUnitCenterName(e.target.value)}
                placeholder="مثلاً: پردیس شهید باهنر"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="font-bold">نوع استخدام</span>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as SchedEmploymentType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {(Object.keys(SCHED_EMPLOYMENT_LABELS) as SchedEmploymentType[]).map((k) => (
                  <option key={k} value={k}>
                    {SCHED_EMPLOYMENT_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-bold">مرتبه علمی</span>
              <input
                type="text"
                list="proposal-prof-rank-list"
                value={academicRank}
                onChange={(e) => setAcademicRank(e.target.value)}
                placeholder="مثلاً: مدرس مدعو / استادیار"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <datalist id="proposal-prof-rank-list">
                <option value="استاد" />
                <option value="دانشیار" />
                <option value="استادیار" />
                <option value="مربی" />
                <option value="مدرس مدعو" />
                <option value="معلم مدعو" />
              </datalist>
            </label>
            <label className="space-y-1">
              <span className="font-bold">تلفن ثابت (اختیاری)</span>
              <input
                type="text"
                value={landlinePhone}
                onChange={(e) => setLandlinePhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                dir="ltr"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="font-bold">وضعیت استخدام (عنوان گلستان)</span>
              <input
                type="text"
                value={employmentStatusRaw}
                onChange={(e) => setEmploymentStatusRaw(e.target.value)}
                placeholder="مثلاً: حق‌التدریس مدعو"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold">نام بانک (اختیاری)</span>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold">شماره حساب / شبا (اختیاری)</span>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                dir="ltr"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="font-bold">توضیحات مدیر گروه برای مدیر سامانه (اختیاری)</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثلاً: جهت تدریس درس روش تدریس علوم در نیمسال جاری معرفی می‌گردد..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ارسال فرم برای تأیید مدیر سامانه</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
