import React, { useState, useEffect, useRef } from 'react';
import { PersianDatePicker } from './PersianDatePicker';
import confetti from 'canvas-confetti';
import { CommuterEligibilityReason, Student, StudentResidenceType } from '../types';
import { Storage, compressAvatarImageFile } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import { getStudentResidenceType } from '../utils/financeUtils';
import {
  ARTISTIC_SKILL_OPTIONS,
  COMMUTER_ELIGIBILITY_OPTIONS,
  CULTURAL_ACTIVITY_OPTIONS,
  ECONOMIC_STATUS_LABELS,
  HOUSING_STATUS_LABELS,
  MENTAL_HEALTH_STATUS_LABELS,
  MENTAL_HEALTH_TOPIC_OPTIONS,
  PHYSICAL_CONDITION_OPTIONS,
  PHYSICAL_HEALTH_STATUS_LABELS,
  SPORTS_ACTIVITY_OPTIONS,
  TECHNICAL_SKILL_OPTIONS,
  formatCommuterReasons,
  formatParentOccupation,
  joinSkillList,
} from '../utils/studentProfileOptions';
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
  Activity,
  Home,
  Lock,
  Sparkles,
  Bus,
  Building2,
  Briefcase,
  Users,
  Palette,
  BookOpen,
  Dumbbell,
  Cpu,
  Brain,
  Info,
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onProfileUpdated: (updatedStudent: Student) => void;
  isFirstLoginForce?: boolean;
  allowSecondaryEdit?: boolean;
}

const SYSTEM_MANAGED_CUSTOM_KEYS = new Set([
  'گروه خونی',
  'بیماری خاص',
  'وضعیت سکونت',
  'علت ترددی',
  'شغل پدر',
  'شغل مادر',
  'رشته‌های هنری',
  'فعالیت‌های فرهنگی',
  'رشته‌های ورزشی',
  'مهارت‌های علمی و فنی',
  'وضعیت سلامت جسمی',
  'وضعیت سلامت روان',
]);

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  onProfileUpdated,
  isFirstLoginForce = false,
  allowSecondaryEdit = false,
}) => {
  const isReadOnly = !isFirstLoginForce && student.isProfileCompleted && !allowSecondaryEdit;

  const resolveInitialResidence = (st: Student): StudentResidenceType => {
    if (st.dormitoryRequestStatus === 'not_needed_commuter') return 'commuter';
    if (st.dormitoryRequestStatus === 'requested') return 'dormitory';
    if (st.residenceType === 'commuter' || st.residenceType === 'dormitory') return st.residenceType;
    if (st.assignedBedId && st.assignmentStatus !== 'none') return 'dormitory';
    return 'dormitory';
  };

  const buildInitialForm = (st: Student): Student => {
    const residence = resolveInitialResidence(st);
    return {
      ...st,
      religion: st.religion || 'اسلام / شیعه',
      postalAddress: st.postalAddress || '',
      residenceType: residence,
      dormitoryRequestStatus:
        st.dormitoryRequestStatus ||
        (residence === 'commuter' ? 'not_needed_commuter' : 'requested'),
      commuterEligibilityReasons: [...(st.commuterEligibilityReasons || [])],
      commuterRequestNotes: st.commuterRequestNotes || '',
      dormitoryRequestNotes: st.dormitoryRequestNotes || '',
      maritalStatus: st.maritalStatus || 'single',
      isHeadOfHousehold: Boolean(st.isHeadOfHousehold),
      fatherAlive: st.fatherAlive !== undefined ? st.fatherAlive : true,
      fatherOccupation: st.fatherOccupation || '',
      motherAlive: st.motherAlive !== undefined ? st.motherAlive : true,
      motherOccupation: st.motherOccupation || '',
      familyMembersCount: st.familyMembersCount || '',
      housingStatus: st.housingStatus || 'owned',
      economicStatus: st.economicStatus || 'moderate',
      livingSituationNotes: st.livingSituationNotes || '',
      artisticSkills: [...(st.artisticSkills || [])],
      artisticOther: st.artisticOther || '',
      culturalActivities: [...(st.culturalActivities || [])],
      culturalOther: st.culturalOther || '',
      sportsActivities: [...(st.sportsActivities || [])],
      sportsOther: st.sportsOther || '',
      technicalSkills: [...(st.technicalSkills || [])],
      technicalOther: st.technicalOther || '',
      bloodType: st.bloodType || String(st.customFields?.['گروه خونی'] || 'O+'),
      physicalHealthStatus: st.physicalHealthStatus || 'healthy',
      physicalConditions: [...(st.physicalConditions || [])],
      regularMedications: st.regularMedications || '',
      foodOrDrugAllergies: st.foodOrDrugAllergies || '',
      medicalDetails:
        st.medicalDetails ||
        (String(st.customFields?.['بیماری خاص'] || '').trim() !== 'ندارد'
          ? String(st.customFields?.['بیماری خاص'] || '').trim()
          : ''),
      mentalHealthStatus: st.mentalHealthStatus || 'good',
      mentalHealthTopics: [...(st.mentalHealthTopics || [])],
      wantsCounselingContact: Boolean(st.wantsCounselingContact),
      mentalHealthNotes: st.mentalHealthNotes || '',
      customFields: { ...(st.customFields || {}) },
    };
  };

  const [formData, setFormData] = useState<Student>(() => buildInitialForm(student));
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomVal, setNewCustomVal] = useState('');
  const [photoPreview, setPhotoPreview] = useState(student.photoUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  // جلوگیری از پاک شدن فیلدهای در حال تایپ هنگام رفرش پس‌زمینه یا تغییر فوکوس پنجره
  const wasOpenRef = useRef(false);
  const loadedStudentIdRef = useRef<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      loadedStudentIdRef.current = null;
      return;
    }

    const shouldInitialize =
      !wasOpenRef.current || loadedStudentIdRef.current !== student.studentId;

    if (shouldInitialize) {
      wasOpenRef.current = true;
      loadedStudentIdRef.current = student.studentId;
      setFormData(buildInitialForm(student));
      setPhotoPreview(student.photoUrl || '');
      setValidationError('');
      setSaveSuccess(false);
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const isCommuterSelected = formData.dormitoryRequestStatus === 'not_needed_commuter';

  const toggleStringArrayField = (
    field:
      | 'artisticSkills'
      | 'culturalActivities'
      | 'sportsActivities'
      | 'technicalSkills'
      | 'physicalConditions'
      | 'mentalHealthTopics',
    value: string
  ) => {
    if (isReadOnly) return;
    setFormData((prev) => {
      const current = prev[field] || [];
      const exists = current.includes(value);
      const next = exists ? current.filter((item) => item !== value) : [...current, value];
      return {
        ...prev,
        [field]: next,
      };
    });
  };

  const toggleCommuterReason = (reason: CommuterEligibilityReason) => {
    if (isReadOnly) return;
    setFormData((prev) => {
      const current = prev.commuterEligibilityReasons || [];
      const exists = current.includes(reason);
      const next = exists ? current.filter((r) => r !== reason) : [...current, reason];
      return {
        ...prev,
        commuterEligibilityReasons: next,
        ...(reason === 'married' && !exists ? { maritalStatus: 'married' } : {}),
        ...(reason === 'head_of_household' && !exists ? { isHeadOfHousehold: true } : {}),
      };
    });
  };

  const handleSelectDormitoryChoice = (choice: 'requested' | 'not_needed_commuter') => {
    if (isReadOnly) return;
    setFormData((prev) => {
      let nextReasons = prev.commuterEligibilityReasons || [];
      if (choice === 'not_needed_commuter' && nextReasons.length === 0) {
        const autoReasons: CommuterEligibilityReason[] = [];
        if (prev.maritalStatus === 'married') autoReasons.push('married');
        if (prev.isHeadOfHousehold) autoReasons.push('head_of_household');
        if ((prev.city || '').includes('اصفهان')) autoReasons.push('isfahan_suburbs_30km');
        nextReasons = autoReasons;
      }
      return {
        ...prev,
        dormitoryRequestStatus: choice,
        residenceType: choice === 'not_needed_commuter' ? 'commuter' : 'dormitory',
        commuterEligibilityReasons: choice === 'not_needed_commuter' ? nextReasons : prev.commuterEligibilityReasons,
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.');
      return;
    }
    try {
      const compressed = await compressAvatarImageFile(file);
      setPhotoPreview(compressed);
      setFormData((prev) => ({ ...prev, photoUrl: compressed }));
      setValidationError('');
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'خطا در پردازش تصویر انتخاب شده.');
    }
  };

  const handleAddCustomField = () => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    setFormData((prev) => {
      const nextCustom = { ...(prev.customFields || {}) };
      delete nextCustom[key];
      return { ...prev, customFields: nextCustom };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setValidationError('');
    if (isReadOnly) {
      setValidationError('دسترسی ویرایش ثانویه اطلاعات و تغییر عکس توسط مدیر سامانه بسته شده است.');
      return;
    }

    const cleanMobile = toEnglishDigits(formData.mobile || '').replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setValidationError('شماره تلفن همراه معتبر دانشجو الزامی است (مثال: 09131234567).');
      return;
    }

    const cleanEmergency = toEnglishDigits(formData.emergencyPhone || '').replace(/\D/g, '');
    if (!cleanEmergency || cleanEmergency.length < 8) {
      setValidationError('شماره تماس اضطراری جهت موارد ضروری و پزشکی الزامی می‌باشد.');
      return;
    }

    const cleanParentPhone = toEnglishDigits(formData.parentPhone || '').replace(/\D/g, '');
    if (!cleanParentPhone || cleanParentPhone.length < 8) {
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

    if (formData.dormitoryRequestStatus === 'not_needed_commuter') {
      const reasons = formData.commuterEligibilityReasons || [];
      if (reasons.length === 0) {
        setValidationError(
          'در صورت انتخاب وضعیت ترددی (عدم نیاز به خوابگاه)، انتخاب حداقل یکی از شروط قانونی ترددی بودن الزامی است.'
        );
        return;
      }
      if (
        reasons.includes('special_case') &&
        (!formData.commuterRequestNotes || formData.commuterRequestNotes.trim().length < 5)
      ) {
        setValidationError(
          'در صورت انتخاب «موارد خاص» به عنوان علت ترددی بودن، نوشتن توضیحات کامل الزامی است.'
        );
        return;
      }
    }

    if (!termsAccepted) {
      setValidationError('جهت تکمیل پرونده، تأیید صحت اطلاعات و مقررات سامانه الزامی است.');
      return;
    }

    setIsSaving(true);
    try {
      let resolvedPhotoUrl = photoPreview || formData.photoUrl;
      if (resolvedPhotoUrl && resolvedPhotoUrl.startsWith('data:image/')) {
        const cloudPhotoRes = await Storage.uploadSinglePhotoToCloud(
          'student',
          student.studentId,
          resolvedPhotoUrl
        );
        if (cloudPhotoRes.supported && cloudPhotoRes.ok) {
          resolvedPhotoUrl = cloudPhotoRes.url;
        } else if (cloudPhotoRes.supported && !cloudPhotoRes.ok) {
          setValidationError(cloudPhotoRes.errorMessage || 'خطا در بارگذاری تصویر در فضای ابری.');
          return;
        }
      }

      const artisticSummary = joinSkillList(formData.artisticSkills, formData.artisticOther);
      const culturalSummary = joinSkillList(formData.culturalActivities, formData.culturalOther);
      const sportsSummary = joinSkillList(formData.sportsActivities, formData.sportsOther);
      const technicalSummary = joinSkillList(formData.technicalSkills, formData.technicalOther);
      const specialConditionSummary = [
        ...(formData.physicalConditions || []),
        (formData.medicalDetails || '').trim(),
      ]
        .filter(Boolean)
        .join('، ');

      const resolvedResidence: StudentResidenceType =
        formData.dormitoryRequestStatus === 'not_needed_commuter' ? 'commuter' : 'dormitory';

      const updatedCustomFields: Record<string, string | number | boolean> = {
        ...(formData.customFields || {}),
        'گروه خونی': formData.bloodType || 'ثبت نشده',
        'بیماری خاص': specialConditionSummary || 'ندارد',
        'وضعیت سکونت': resolvedResidence === 'commuter' ? 'ترددی (عدم نیاز به خوابگاه)' : 'متقاضی خوابگاه (خوابگاهی)',
        'شغل پدر': formatParentOccupation(formData.fatherAlive, formData.fatherOccupation),
        'شغل مادر': formatParentOccupation(formData.motherAlive, formData.motherOccupation),
        'وضعیت سلامت جسمی':
          PHYSICAL_HEALTH_STATUS_LABELS[formData.physicalHealthStatus || 'healthy'],
        'وضعیت سلامت روان':
          MENTAL_HEALTH_STATUS_LABELS[formData.mentalHealthStatus || 'good'],
      };

      if (resolvedResidence === 'commuter') {
        updatedCustomFields['علت ترددی'] =
          formatCommuterReasons(formData.commuterEligibilityReasons) || 'ثبت شده';
      } else {
        delete updatedCustomFields['علت ترددی'];
      }
      if (artisticSummary) updatedCustomFields['رشته‌های هنری'] = artisticSummary;
      else delete updatedCustomFields['رشته‌های هنری'];
      if (culturalSummary) updatedCustomFields['فعالیت‌های فرهنگی'] = culturalSummary;
      else delete updatedCustomFields['فعالیت‌های فرهنگی'];
      if (sportsSummary) updatedCustomFields['رشته‌های ورزشی'] = sportsSummary;
      else delete updatedCustomFields['رشته‌های ورزشی'];
      if (technicalSummary) updatedCustomFields['مهارت‌های علمی و فنی'] = technicalSummary;
      else delete updatedCustomFields['مهارت‌های علمی و فنی'];

      const updated: Student = {
        ...formData,
        residenceType: resolvedResidence,
        dormitoryRequestStatus:
          resolvedResidence === 'commuter' ? 'not_needed_commuter' : 'requested',
        fatherOccupation: formData.fatherAlive === false ? '' : (formData.fatherOccupation || '').trim(),
        motherOccupation: formData.motherAlive === false ? '' : (formData.motherOccupation || '').trim(),
        isProfileCompleted: true,
        customFields: updatedCustomFields,
        photoUrl: resolvedPhotoUrl,
      };

      const result = Storage.updateStudentProfile(student.studentId, updated);
      if (!result.success) {
        setValidationError(result.message);
        return;
      }
      await Storage.waitForPendingCloudSync();
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

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = window.setTimeout(() => {
        setSaveSuccess(false);
        onProfileUpdated(updated);
        onClose();
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  const renderChipGroup = (
    options: string[],
    selected: string[],
    field:
      | 'artisticSkills'
      | 'culturalActivities'
      | 'sportsActivities'
      | 'technicalSkills'
      | 'physicalConditions'
      | 'mentalHealthTopics',
    activeClass: string
  ) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            disabled={isReadOnly}
            onClick={() => toggleStringArrayField(field, opt)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer disabled:cursor-default ${
              active
                ? activeClass
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-400'
            }`}
          >
            {active ? '✓ ' : '+ '}
            {opt}
          </button>
        );
      })}
    </div>
  );

  const currentResidenceLabel =
    getStudentResidenceType(formData) === 'commuter' ? 'ترددی (غیرخوابگاهی)' : 'خوابگاهی';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (!isFirstLoginForce && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[93vh] overflow-y-auto">
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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {isFirstLoginForce
                  ? 'پذیرش و تکمیل جامع پرونده دانشجو (سامانه جامع خدمات دانشجویی)'
                  : isReadOnly
                  ? 'مشاهده پرونده جامع دانشجو'
                  : 'ویرایش پرونده جامع، وضعیت سکونت، توانمندی‌ها و سلامت'}
              </h2>
              {isFirstLoginForce && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold text-[11px] border border-rose-300 dark:border-rose-800">
                  تکمیل الزامی در بدو ورود
                </span>
              )}
              {isReadOnly && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>فقط خواندنی</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isFirstLoginForce
                ? 'دانشجومعلم گرامی؛ پس از تکمیل و تأیید اطلاعات هویتی، خانواده، توانمندی‌ها و سلامت، وضعیت درخواست خوابگاه یا ترددی بودن خود را مشخص نمایید تا تمامی خدمات پیشخوان دانشگاه برای شما فعال شود.'
                : isReadOnly
                ? 'اطلاعات و تصویر پرسنلی شما پس از ثبت اولیه قفل شده است و در صورت نیاز به اصلاح باید با مدیر سامانه هماهنگ فرمایید.'
                : 'بروزرسانی مشخصات فردی، درخواست خوابگاه یا ترددی، وضعیت خانواده و شغل والدین، توانمندی‌های هنری/فرهنگی/ورزشی/فنی و پرونده سلامت جسمی و روانی'}
            </p>
          </div>
        </div>

        {/* بنر راهنمای اولین ورود */}
        {isFirstLoginForce && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-sm">
                تکمیل پرونده جامع و تعیین وضعیت سکونت (خوابگاهی / ترددی) در اولین ورود
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                این سامانه، <strong>پیشخوان جامع خدمات دانشجویی</strong> است و هم دانشجویان خوابگاهی و هم دانشجویان ترددی (غیرخوابگاهی) تمامی امور دانشگاهی خود را از طریق آن پیگیری می‌کنند. لطفاً فیلدهای ستاره‌دار (*) را تکمیل نموده و درخواست خوابگاه یا عدم نیاز (ترددی) را انتخاب فرمایید.
              </div>
            </div>
          </div>
        )}

        {/* بنر قفل بودن ویرایش ثانویه */}
        {isReadOnly && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-sm">
                دسترسی ویرایش ثانویه اطلاعات و تغییر عکس بسته شده است
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                اطلاعات پرونده شما پیش‌تر ثبت نهایی شده و در حال حاضر فقط قابل مشاهده است. برای اعمال هرگونه اصلاح یا تغییر وضعیت سکونت، به مدیر سامانه جامع خدمات دانشجویی مراجعه فرمایید.
              </div>
            </div>
          </div>
        )}

        {/* پیام‌های خطا یا موفقیت */}
        {validationError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-bold">{validationError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <div className="font-bold text-sm">
                پرونده جامع شما با موفقیت ثبت و تأیید گردید! ({currentResidenceLabel})
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                هم‌اکنون دسترسی به خدمات پیشخوان جامع خدمات دانشجویی برای شما فعال است.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* بخش ۱: عکس پرسنلی و اطلاعات گلستان */}
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
              {!isReadOnly && (
                <>
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
                </>
              )}
            </div>

            <div className="text-center sm:text-right flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  تصویر پرسنلی جهت کارت دانشجویی و پیشخوان خدمات دانشگاه
                </h4>
                {photoPreview && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    بارگذاری شده
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                این عکس در کارت دانشجویی، داشبورد اختصاصی و پرونده الکترونیک شما نمایش داده می‌شود. (JPG یا PNG)
              </p>
              {!isReadOnly && (
                <label
                  htmlFor="photoUploadInputModal"
                  className="inline-flex items-center gap-1.5 mt-2.5 px-3.5 py-1.5 rounded-xl border border-teal-400 dark:border-teal-700 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photoPreview ? 'تغییر عکس پرسنلی' : 'بارگذاری فایل عکس پرسنلی'}</span>
                </label>
              )}
            </div>
          </div>

          <fieldset disabled={isReadOnly} className="space-y-6 disabled:opacity-90">
            {/* مشخصات ثابت گلستان */}
            <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300 mb-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>مشخصات آموزشی و شناسنامه‌ای (ثبت‌شده در سامانه گلستان):</span>
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

            {/* بخش ۲: تعیین وضعیت سکونت — درخواست خوابگاه یا عدم نیاز (ترددی) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-amber-950/20 border-2 border-indigo-200 dark:border-indigo-800/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>تعیین وضعیت سکونت: درخواست خوابگاه یا ترددی (عدم نیاز به خوابگاه) *</span>
                </h4>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                    isCommuterSelected
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                      : 'bg-teal-100 text-teal-900 dark:bg-teal-900/60 dark:text-teal-200'
                  }`}
                >
                  انتخاب فعلی: {isCommuterSelected ? 'دانشجوی ترددی (غیرخوابگاهی)' : 'درخواست خوابگاه (خوابگاهی)'}
                </span>
              </div>

              {/* کادر اطلاع‌رسانی رسمی شرایط ترددی بودن */}
              <div className="p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100 text-xs space-y-1.5">
                <div className="font-extrabold flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>ضوابط و شرایط ترددی بودن (عدم نیاز به خوابگاه):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-900/90 dark:text-blue-200/90">
                  دانشجویان ترددی (غیرخوابگاهی) علاوه بر عدم دریافت امکانات خوابگاهی، به <strong>تمامی دیگر خدمات دانشگاه در این سامانه</strong> (امور آموزشی، فرهنگی، ورزشی، کتابخانه، مشاوره، نظرسنجی، انتخابات، سامانه‌های دانشجویی و...) دسترسی کامل دارند. دانشجو در یکی از شرایط زیر می‌تواند ترددی باشد:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] font-bold text-blue-900 dark:text-blue-100">
                  <li className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center shrink-0">۱</span>
                    <span>ساکن شهر اصفهان یا حومه تا شعاع ۳۰ کیلومتر</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center shrink-0">۲</span>
                    <span>متأهل باشد</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center shrink-0">۳</span>
                    <span>سرپرست خانوار باشد</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center shrink-0">۴</span>
                    <span>موارد خاص (با ذکر توضیحات)</span>
                  </li>
                </ul>
              </div>

              {/* دو کارت انتخاب: تیک درخواست خوابگاه یا تیک عدم نیاز و ترددی */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => handleSelectDormitoryChoice('requested')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                    !isCommuterSelected
                      ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-teal-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!isCommuterSelected}
                    onChange={() => handleSelectDormitoryChoice('requested')}
                    className="mt-1 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-teal-900 dark:text-teal-200">
                      <Home className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>درخواست خوابگاه (دانشجوی خوابگاهی)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      متقاضی استفاده از اتاق، تخت و امکانات رفاهی سراهای دانشجویی در کنار سایر خدمات دانشگاهی هستم.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => handleSelectDormitoryChoice('not_needed_commuter')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                    isCommuterSelected
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isCommuterSelected}
                    onChange={() => handleSelectDormitoryChoice('not_needed_commuter')}
                    className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                      <Bus className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>عدم نیاز به خوابگاه / ترددی (غیرخوابگاهی)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      نیازی به امکانات خوابگاهی ندارم و به صورت ترددی از سایر خدمات دانشگاهی سامانه استفاده می‌نمایم.
                    </p>
                  </div>
                </label>
              </div>

              {/* جزئیات و علت انتخاب */}
              {isCommuterSelected ? (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                  <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                    انتخاب شرط / علت ترددی بودن (حداقل یک مورد را انتخاب نمایید) *
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COMMUTER_ELIGIBILITY_OPTIONS.map((opt) => {
                      const checked = (formData.commuterEligibilityReasons || []).includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 cursor-pointer transition ${
                            checked
                              ? 'bg-amber-100/80 dark:bg-amber-900/50 border-amber-500 text-amber-950 dark:text-amber-100 font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCommuterReason(opt.value)}
                            className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold">{opt.label}</div>
                            {opt.description && (
                              <div className="text-[10px] opacity-75 mt-0.5 leading-snug">
                                {opt.description}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                      توضیحات دانشجو درباره عدم نیاز به خوابگاه / ترددی بودن
                      {(formData.commuterEligibilityReasons || []).includes('special_case')
                        ? ' (الزامی برای موارد خاص) *'
                        : ' (اختیاری)'}
                    </label>
                    <textarea
                      rows={2}
                      value={formData.commuterRequestNotes || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, commuterRequestNotes: e.target.value }))
                      }
                      placeholder="مثلاً محل دقیق سکونت در حومه اصفهان (فاصله تقریبی)، توضیحات وضعیت تأهل، سرپرستی خانوار یا شرح کامل موارد خاص..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-teal-900 dark:text-teal-200 mb-1">
                    توضیحات تکمیلی درخواست خوابگاه (اختیاری)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.dormitoryRequestNotes || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, dormitoryRequestNotes: e.target.value }))
                    }
                    placeholder="در صورت داشتن ملاحظه خاص درباره اسکان، هم‌اتاقی، طبقه همکف به دلیل شرایط جسمی و... اینجا بنویسید."
                    className="w-full px-3.5 py-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            {/* بخش ۳: اطلاعات فردی، شناسنامه‌ای و تأهل */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" />
                <span>اطلاعات فردی، شناسنامه‌ای و وضعیت تأهل</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام پدر *
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fatherName: e.target.value }))}
                    placeholder="نام پدر"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ تولد *
                  </label>
                  <PersianDatePicker
                    value={formData.birthDate || ''}
                    onChange={(val) => setFormData((prev) => ({ ...prev, birthDate: val }))}
                    placeholder="مثلاً 1383/05/15"
                    digits="en"
                    defaultYear={1383}
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 dir-ltr text-left"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    دین و مذهب *
                  </label>
                  <input
                    type="text"
                    value={formData.religion ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, religion: e.target.value }))}
                    placeholder="اسلام / شیعه"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    وضعیت تأهل
                  </label>
                  <select
                    value={formData.maritalStatus || 'single'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maritalStatus: e.target.value as 'single' | 'married',
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="single">مجرد</option>
                    <option value="married">متأهل</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isHeadOfHousehold)}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isHeadOfHousehold: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>سرپرست خانوار هستم</span>
                </label>
              </div>
            </div>

            {/* بخش ۴: اطلاعات خانواده، شغل والدین و وضعیت زندگی */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>اطلاعات خانواده، شغل والدین و وضعیت زندگی دانشجو</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* وضعیت حیات و شغل پدر */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      وضعیت پدر:
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData((prev) => ({ ...prev, fatherAlive: true }))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          formData.fatherAlive !== false
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        در قید حیات
                      </button>
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            fatherAlive: false,
                            fatherOccupation: '',
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          formData.fatherAlive === false
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        مرحوم (فوت شده)
                      </button>
                    </div>
                  </div>
                  {formData.fatherAlive !== false ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        شغل پدر
                      </label>
                      <input
                        type="text"
                        value={formData.fatherOccupation || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, fatherOccupation: e.target.value }))
                        }
                        placeholder="مثلاً فرهنگی بازنشسته، کارمند، آزاد، کشاورز و..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      روحشان شاد — نیازی به ثبت شغل پدر نمی‌باشد.
                    </div>
                  )}
                </div>

                {/* وضعیت حیات و شغل مادر */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      وضعیت مادر:
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData((prev) => ({ ...prev, motherAlive: true }))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          formData.motherAlive !== false
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        در قید حیات
                      </button>
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            motherAlive: false,
                            motherOccupation: '',
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          formData.motherAlive === false
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        مرحومه (فوت شده)
                      </button>
                    </div>
                  </div>
                  {formData.motherAlive !== false ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        شغل مادر
                      </label>
                      <input
                        type="text"
                        value={formData.motherOccupation || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, motherOccupation: e.target.value }))
                        }
                        placeholder="مثلاً خانه‌دار، فرهنگی، پرستار، کارمند و..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      روحشان شاد — نیازی به ثبت شغل مادر نمی‌باشد.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>تعداد اعضای خانواده</span>
                  </label>
                  <input
                    type="text"
                    value={formData.familyMembersCount || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, familyMembersCount: e.target.value }))
                    }
                    placeholder="مثلاً ۴ نفر"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    وضعیت مسکن خانواده
                  </label>
                  <select
                    value={formData.housingStatus || 'owned'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        housingStatus: e.target.value as Student['housingStatus'],
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    {Object.entries(HOUSING_STATUS_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    وضعیت معیشتی / اقتصادی خانواده
                  </label>
                  <select
                    value={formData.economicStatus || 'moderate'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        economicStatus: e.target.value as Student['economicStatus'],
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    {Object.entries(ECONOMIC_STATUS_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات تکمیلی وضعیت زندگی و خانواده (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={formData.livingSituationNotes || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, livingSituationNotes: e.target.value }))
                  }
                  placeholder="ملاحظات ویژه خانوادگی، شرایط سرپرستی، پوشش نهادهای حمایتی یا هر توضیحی که برای حمایت رفاهی دانشگاه مفید است..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* بخش ۵: اطلاعات تماس و نشانی */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-teal-600" />
                <span>اطلاعات تماس، شماره‌های اضطراری و نشانی محل سکونت (الزامی)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شماره همراه دانشجو *
                  </label>
                  <input
                    type="text"
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                    placeholder="0913xxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 dir-ltr text-left"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شماره تماس اضطراری (اورژانس و حوادث) *
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyPhone || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, emergencyPhone: e.target.value }))
                    }
                    placeholder="0913xxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 dir-ltr text-left"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شماره تماس والدین / ولی *
                  </label>
                  <input
                    type="text"
                    value={formData.parentPhone || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, parentPhone: e.target.value }))
                    }
                    placeholder="0913xxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 dir-ltr text-left"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تلفن ثابت منزل (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="031xxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 dir-ltr text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>استان محل سکونت *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.province || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value }))}
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
                    value={formData.city || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="مثلاً اصفهان، نجف‌آباد، کاشان، شهرکرد..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نشانی دقیق پستی محل سکونت خانواده *
                </label>
                <textarea
                  rows={2}
                  value={formData.postalAddress || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, postalAddress: e.target.value }))
                  }
                  placeholder="خیابان، کوچه، پلاک، طبقه و کد پستی ده‌رقمی منزل..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            {/* بخش ۶: توانمندی‌ها، مهارت‌ها و علایق دانشجو (۴ حوزه جداگانه قابل انتخاب و گزارش‌گیری) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-fuchsia-50/50 via-white to-teal-50/50 dark:from-fuchsia-950/20 dark:via-slate-900 dark:to-teal-950/20 border border-fuchsia-200/80 dark:border-fuchsia-900/50 space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-fuchsia-600" />
                  <span>توانمندی‌ها، مهارت‌ها و علایق دانشجو (قابل انتخاب چندگانه و گزارش‌گیری)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  هر موردی که در آن مهارت، سابقه فعالیت یا علاقه دارید را انتخاب کنید و در صورت نیاز موارد دلخواه خود را در کادر «سایر» بنویسید.
                </p>
              </div>

              {/* ۱. رشته‌های هنری */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-pink-200/80 dark:border-pink-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
                    <Palette className="w-4 h-4" />
                    <span>انواع رشته‌های هنری</span>
                  </span>
                  <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">
                    {(formData.artisticSkills || []).length} مورد انتخاب‌شده
                  </span>
                </div>
                {renderChipGroup(
                  ARTISTIC_SKILL_OPTIONS,
                  formData.artisticSkills || [],
                  'artisticSkills',
                  'bg-pink-600 text-white border-pink-600 shadow-xs'
                )}
                <input
                  type="text"
                  value={formData.artisticOther || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, artisticOther: e.target.value }))
                  }
                  placeholder="سایر رشته‌های هنری، ساز، مقام‌ها یا توضیحات هنری..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-xs"
                />
              </div>

              {/* ۲. فعالیت‌های فرهنگی و قرآنی */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-violet-200/80 dark:border-violet-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>انواع فعالیت‌های فرهنگی، قرآنی و دانشجویی</span>
                  </span>
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                    {(formData.culturalActivities || []).length} مورد انتخاب‌شده
                  </span>
                </div>
                {renderChipGroup(
                  CULTURAL_ACTIVITY_OPTIONS,
                  formData.culturalActivities || [],
                  'culturalActivities',
                  'bg-violet-600 text-white border-violet-600 shadow-xs'
                )}
                <input
                  type="text"
                  value={formData.culturalOther || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, culturalOther: e.target.value }))
                  }
                  placeholder="سایر فعالیت‌های فرهنگی، تعداد جزء حفظ قرآن، عضویت در تشکل یا افتخارات..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-xs"
                />
              </div>

              {/* ۳. فعالیت‌های ورزشی */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-emerald-200/80 dark:border-emerald-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4" />
                    <span>انواع رشته‌ها و فعالیت‌های ورزشی</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {(formData.sportsActivities || []).length} مورد انتخاب‌شده
                  </span>
                </div>
                {renderChipGroup(
                  SPORTS_ACTIVITY_OPTIONS,
                  formData.sportsActivities || [],
                  'sportsActivities',
                  'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                )}
                <input
                  type="text"
                  value={formData.sportsOther || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sportsOther: e.target.value }))
                  }
                  placeholder="سایر رشته‌های ورزشی، سطح حرفه‌ای/تیم منتخب، مربیگری یا داوری..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-xs"
                />
              </div>

              {/* ۴. مهارت‌های علمی، فنی و دیجیتال */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-sky-200/80 dark:border-sky-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>مهارت‌های علمی، فنی، فناوری و تدریس</span>
                  </span>
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                    {(formData.technicalSkills || []).length} مورد انتخاب‌شده
                  </span>
                </div>
                {renderChipGroup(
                  TECHNICAL_SKILL_OPTIONS,
                  formData.technicalSkills || [],
                  'technicalSkills',
                  'bg-sky-600 text-white border-sky-600 shadow-xs'
                )}
                <input
                  type="text"
                  value={formData.technicalOther || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, technicalOther: e.target.value }))
                  }
                  placeholder="سایر مهارت‌های علمی، تخصصی، زبان‌های خارجی، نرم‌افزارها یا سابقه تدریس..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {/* بخش ۷: پرونده جامع سلامت جسمی و روانی */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* سلامت جسمی */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-3">
                <h4 className="text-xs sm:text-sm font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-600" />
                  <span>پرونده سلامت جسمی و سوابق پزشکی</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      گروه خونی *
                    </label>
                    <select
                      value={formData.bloodType || 'O+'}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, bloodType: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
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
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      وضعیت کلی سلامت جسمی
                    </label>
                    <select
                      value={formData.physicalHealthStatus || 'healthy'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          physicalHealthStatus: e.target.value as Student['physicalHealthStatus'],
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                    >
                      {Object.entries(PHYSICAL_HEALTH_STATUS_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    موارد پزشکی یا ملاحظات جسمی (در صورت وجود انتخاب نمایید):
                  </span>
                  {renderChipGroup(
                    PHYSICAL_CONDITION_OPTIONS,
                    formData.physicalConditions || [],
                    'physicalConditions',
                    'bg-rose-600 text-white border-rose-600 shadow-xs'
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      حساسیت غذایی یا دارویی
                    </label>
                    <input
                      type="text"
                      value={formData.foodOrDrugAllergies || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, foodOrDrugAllergies: e.target.value }))
                      }
                      placeholder="مثلاً پنی‌سیلین، بادام‌زمینی یا ندارد"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      داروهای مصرفی مستمر
                    </label>
                    <input
                      type="text"
                      value={formData.regularMedications || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, regularMedications: e.target.value }))
                      }
                      placeholder="نام دارو یا «مصرف ندارم»"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    توضیحات تکمیلی پزشکی / سابقه جراحی یا بیماری خاص
                  </label>
                  <textarea
                    rows={2}
                    value={formData.medicalDetails || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, medicalDetails: e.target.value }))
                    }
                    placeholder="در صورت وجود ملاحظه پزشکی خاص جهت اطلاع اورژانسی بنویسید..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              {/* سلامت روانی */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>وضعیت سلامت روان و نیازهای مشاوره‌ای</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold">
                    محرمانه
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ارزیابی کلی وضعیت روحی و روانی فعلی
                  </label>
                  <select
                    value={formData.mentalHealthStatus || 'good'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        mentalHealthStatus: e.target.value as Student['mentalHealthStatus'],
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                  >
                    {Object.entries(MENTAL_HEALTH_STATUS_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    محورهایی که مایل به دریافت راهنمایی یا پشتیبانی مرکز مشاوره هستید:
                  </span>
                  {renderChipGroup(
                    MENTAL_HEALTH_TOPIC_OPTIONS,
                    formData.mentalHealthTopics || [],
                    'mentalHealthTopics',
                    'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  )}
                </div>

                <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.wantsCounselingContact)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        wantsCounselingContact: e.target.checked,
                      }))
                    }
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 leading-relaxed">
                    تمایل دارم مشاور مرکز مشاوره دانشگاه جهت گفتگوی حمایتی به‌صورت کاملاً محرمانه با من در ارتباط باشد.
                  </span>
                </label>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    توضیحات محرمانه جهت مرکز مشاوره (اختیاری)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.mentalHealthNotes || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, mentalHealthNotes: e.target.value }))
                    }
                    placeholder="هر نکته‌ای که مایلید مشاوران دانشگاه از آن مطلع باشند (محرمانه نزد مرکز مشاوره و مدیریت)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* بخش ۸: فیلدهای دلخواه اضافه */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span>سایر مشخصات و فیلدهای دلخواه دانشجو</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {Object.entries(formData.customFields || {})
                  .filter(([k]) => !SYSTEM_MANAGED_CUSTOM_KEYS.has(k))
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

              {!isReadOnly && (
                <div className="p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-dashed border-teal-200 dark:border-teal-800/60">
                  <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 block mb-2">
                    افزودن مشخصه یا افتخار جدید (اختیاری):
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="عنوان مشخصه (مثلاً رتبه کنکور، افتخار المپیاد)"
                      value={newCustomKey}
                      onChange={(e) => setNewCustomKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="توضیح یا مقدار"
                      value={newCustomVal}
                      onChange={(e) => setNewCustomVal(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ثبت</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* تعهدنامه صحت اطلاعات */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  اینجانب <strong>{student.fullName}</strong> صحت کلیه اطلاعات مندرج در این پرونده (از جمله وضعیت سکونت، خانواده، توانمندی‌ها و سلامت) را تأیید نموده و متعهد می‌گردم کلیه ضوابط، مقررات آموزشی، انضباطی و شئونات اسلامی دانشگاه فرهنگیان را به دقت رعایت نمایم.
                </span>
              </label>
            </div>
          </fieldset>

          {/* دکمه‌های فرم */}
          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {!isReadOnly && (
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-600/25 transition cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'در حال ذخیره و همگام‌سازی ابری...'
                    : isFirstLoginForce
                    ? isCommuterSelected
                      ? 'تأیید اطلاعات و ثبت وضعیت ترددی (ورود به پیشخوان)'
                      : 'تأیید اطلاعات و ثبت درخواست خوابگاه (ورود به پیشخوان)'
                    : 'ذخیره تغییرات پرونده جامع'}
                </span>
              </button>
            )}
            {!isFirstLoginForce && (
              <button
                type="button"
                onClick={onClose}
                className={`${
                  isReadOnly
                    ? 'w-full bg-slate-800 text-white hover:bg-slate-700'
                    : 'px-6 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                } py-3.5 rounded-2xl text-xs font-semibold cursor-pointer transition`}
              >
                {isReadOnly ? 'بستن پنجره' : 'انصراف'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
