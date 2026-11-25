import React, { useMemo, useState } from 'react';
import {
  CommunityChatSettings,
  CommunityForumCategory,
  CommunityResidenceScope,
  CurrentUser,
  Student,
} from '../types';
import { Storage } from '../utils/storage';
import { FORUM_CATEGORIES_META, STAFF_ROLE_OPTIONS } from '../utils/communityStickers';
import {
  X,
  Plus,
  Hash,
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Building2,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

interface CommunityForumRequestModalProps {
  currentUser: NonNullable<CurrentUser>;
  chatSettings: CommunityChatSettings;
  students: Student[];
  onClose: () => void;
  onCreated: (message: string, forumId?: string) => void;
}

export const CommunityForumRequestModal: React.FC<CommunityForumRequestModalProps> = ({
  currentUser,
  chatSettings,
  students,
  onClose,
  onCreated,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const isStaffUser = currentUser.role !== 'student';

  const [audienceType, setAudienceType] = useState<'students_all' | 'staff_only'>(
    isStaffUser && !isAdmin ? 'staff_only' : 'students_all'
  );
  const [allStaffRolesAllowed, setAllStaffRolesAllowed] = useState(true);
  const [selectedStaffRoles, setSelectedStaffRoles] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CommunityForumCategory>(
    isStaffUser && !isAdmin ? 'other' : 'scientific'
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // فیلتر مخاطبین و شرایط عضویت
  const [allFieldsAllowed, setAllFieldsAllowed] = useState(true);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [customFieldInput, setCustomFieldInput] = useState('');

  const [allEntryTermsAllowed, setAllEntryTermsAllowed] = useState(true);
  const [selectedEntryTerms, setSelectedEntryTerms] = useState<string[]>([]);
  const [customEntryInput, setCustomEntryInput] = useState('');

  const [allowedResidence, setAllowedResidence] = useState<CommunityResidenceScope>('all');
  const [rulesAccepted, setRulesAccepted] = useState(isStaffUser);
  const [directPublishByAdmin, setDirectPublishByAdmin] = useState(isAdmin);
  const [error, setError] = useState<string | null>(null);

  const availableFields = useMemo(() => {
    const setFields = new Set<string>();
    students.forEach((s) => {
      if (s.fieldOfStudy && s.fieldOfStudy.trim()) setFields.add(s.fieldOfStudy.trim());
    });
    if (currentUser.role === 'student' && currentUser.student.fieldOfStudy) {
      setFields.add(currentUser.student.fieldOfStudy.trim());
    }
    if (setFields.size === 0) {
      [
        'آموزش ابتدایی',
        'آموزش ریاضی',
        'آموزش زبان و ادبیات فارسی',
        'آموزش علوم تجربی',
        'آموزش زبان انگلیسی',
        'آموزش الهیات',
        'آموزش علوم اجتماعی',
        'آموزش تربیت بدنی',
        'مشاوره و راهنمایی',
      ].forEach((f) => setFields.add(f));
    }
    return Array.from(setFields).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [students, currentUser]);

  const availableEntryTerms = useMemo(() => {
    const setTerms = new Set<string>();
    students.forEach((s) => {
      if (s.entryTerm && s.entryTerm.trim()) setTerms.add(s.entryTerm.trim());
    });
    if (currentUser.role === 'student' && currentUser.student.entryTerm) {
      setTerms.add(currentUser.student.entryTerm.trim());
    }
    if (setTerms.size === 0) {
      ['۱۴۰۰', '۱۴۰۱', '۱۴۰۲', '۱۴۰۳', '۱۴۰۴', '۱۴۰۵'].forEach((t) => setTerms.add(t));
    }
    return Array.from(setTerms).sort((a, b) => b.localeCompare(a, 'fa'));
  }, [students, currentUser]);

  const addTag = () => {
    const clean = tagInput.replace(/^#+/, '').trim();
    if (!clean) return;
    if (tags.length >= 8) {
      setError('حداکثر ۸ تگ برای هر تالار مجاز است.');
      return;
    }
    if (!tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setTagInput('');
    setError(null);
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const addCustomField = () => {
    const val = customFieldInput.trim();
    if (!val) return;
    if (!selectedFields.includes(val)) {
      setSelectedFields((prev) => [...prev, val]);
    }
    setCustomFieldInput('');
  };

  const toggleEntryTerm = (term: string) => {
    setSelectedEntryTerms((prev) =>
      prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term]
    );
  };

  const addCustomEntry = () => {
    const val = customEntryInput.trim();
    if (!val) return;
    if (!selectedEntryTerms.includes(val)) {
      setSelectedEntryTerms((prev) => [...prev, val]);
    }
    setCustomEntryInput('');
  };

  const getCreatorMeta = () => {
    if (currentUser.role === 'student') {
      return {
        id: currentUser.student.studentId,
        name: currentUser.student.fullName,
        role: 'student',
      };
    }
    if (currentUser.role === 'admin') {
      return { id: currentUser.username, name: currentUser.name || 'مدیر کل سامانه', role: 'admin' };
    }
    if (currentUser.role === 'supervisor') {
      return { id: currentUser.supervisor.id, name: currentUser.supervisor.fullName, role: 'supervisor' };
    }
    if (currentUser.role === 'counselor') {
      return { id: currentUser.counselor.id, name: currentUser.counselor.fullName, role: 'counselor' };
    }
    if (currentUser.role === 'maintenance') {
      return { id: currentUser.technician.id, name: currentUser.technician.fullName, role: 'maintenance' };
    }
    if (currentUser.role === 'professor') {
      return { id: currentUser.professor.id, name: currentUser.professor.fullName, role: 'professor' };
    }
    return { id: currentUser.staff.id, name: currentUser.staff.fullName, role: currentUser.role };
  };

  const toggleStaffRole = (role: string) => {
    setSelectedStaffRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (audienceType === 'staff_only') {
      if (!allStaffRolesAllowed && selectedStaffRoles.length === 0) {
        setError('لطفاً حداقل یک بخش/سمت کارکنان مجاز انتخاب کنید یا گزینه «همه کارکنان» را فعال نمایید.');
        return;
      }
    } else {
      if (!allFieldsAllowed && selectedFields.length === 0) {
        setError('لطفاً حداقل یک رشته تحصیلی مجاز انتخاب کنید یا گزینه «همه رشته‌ها» را فعال نمایید.');
        return;
      }
      if (!allEntryTermsAllowed && selectedEntryTerms.length === 0) {
        setError('لطفاً حداقل یک ورودی مجاز انتخاب کنید یا گزینه «همه ورودی‌ها» را فعال نمایید.');
        return;
      }
    }

    const creator = getCreatorMeta();
    const res = Storage.createCommunityForumRequest({
      title,
      description,
      category,
      tags,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorRole: creator.role,
      allowedFields: audienceType === 'staff_only' || allFieldsAllowed ? [] : selectedFields,
      allowedEntryTerms: audienceType === 'staff_only' || allEntryTermsAllowed ? [] : selectedEntryTerms,
      allowedResidence: audienceType === 'staff_only' ? 'all' : allowedResidence,
      audienceType,
      allowedStaffRoles: audienceType === 'staff_only' && !allStaffRolesAllowed ? selectedStaffRoles : [],
      rulesAcceptedByCreator: rulesAccepted,
      directPublishByAdmin: isAdmin && directPublishByAdmin,
    });

    if (!res.success) {
      setError(res.message);
      return;
    }
    onCreated(res.message, res.forum?.id);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* هدر */}
        <div className="px-5 py-4 bg-gradient-to-l from-teal-600 via-emerald-600 to-teal-700 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base truncate">
                {isAdmin
                  ? 'ایجاد تالار گفتگوی تخصصی / گروه یا انجمن جدید'
                  : 'ثبت درخواست ایجاد تالار تخصصی، گروه یا انجمن دانشجویی'}
              </h3>
              <p className="text-[11px] text-teal-100 truncate">
                {isAdmin
                  ? 'تعیین موضوع، تگ‌ها و شرایط عضویت دانشجویان'
                  : 'پس از تأیید هم‌زمان «مدیر سامانه» و «واحد حراست» به‌صورت رسمی منتشر می‌شود'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition cursor-pointer shrink-0"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* انتخاب نوع تالار برای کاربران کارکنان و مدیر */}
          {isStaffUser && (
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200">
                نوع مخاطبان تالار / گروه گفتگو
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAudienceType('staff_only')}
                  className={`p-3 rounded-2xl border-2 text-right transition cursor-pointer flex items-start gap-2.5 ${
                    audienceType === 'staff_only'
                      ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-500 text-violet-950 dark:text-violet-100'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-violet-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold">گروه / تالار ویژه کارکنان (داخلی)</div>
                    <div className="text-[10px] opacity-80 leading-4 mt-0.5">
                      مخصوص همکاران و کارشناسان؛ برای دانشجویان قابل مشاهده نیست و بلافاصله فعال می‌شود.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceType('students_all')}
                  className={`p-3 rounded-2xl border-2 text-right transition cursor-pointer flex items-start gap-2.5 ${
                    audienceType === 'students_all'
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-950 dark:text-teal-100'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold">تالار / انجمن دانشجویی</div>
                    <div className="text-[10px] opacity-80 leading-4 mt-0.5">
                      قابل مشاهده برای دانشجویان با امکان تعیین رشته، ورودی و نوع سکونت.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {!isAdmin && audienceType === 'students_all' && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold">فرایند تأیید دو مرحله‌ای: </span>
                درخواست شما ابتدا توسط <strong>مدیر کل سامانه</strong> و <strong>واحد حراست</strong> بررسی می‌شود. پس از تأیید هر دو مرجع، تالار فعال شده و برای دانشجویان واجد شرایط قابل مشاهده و عضویت خواهد بود.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* عنوان و دسته‌بندی */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                عنوان تالار تخصصی / گروه / انجمن *
              </label>
              <input
                type="text"
                required
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: تالار تخصصی آموزش ریاضی ورودی ۱۴۰۳ یا انجمن کتاب‌خوانی سرا"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                دسته‌بندی موضوعی *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CommunityForumCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {(Object.keys(FORUM_CATEGORIES_META) as CommunityForumCategory[])
                  .filter((k) => k !== 'public')
                  .map((key) => (
                    <option key={key} value={key}>
                      {FORUM_CATEGORIES_META[key].label}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                افزودن تگ‌های موضوعی (اختیاری)
              </label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="مثلاً: پژوهش، جزوه..."
                    className="w-full pr-8 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن</span>
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* توضیحات و هدف */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
              هدف تشکیل و شرح فعالیت تالار *
            </label>
            <textarea
              required
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="هدف علمی، فرهنگی، صنفی یا آموزشی این تالار را به‌صورت شفاف توضیح دهید..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* تعیین شرایط و مخاطبین مجاز ورود */}
          {audienceType === 'staff_only' ? (
            <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-violet-900 dark:text-violet-200">
                  <Briefcase className="w-4 h-4 text-violet-600" />
                  <span>واحدها و کارکنان مجاز به مشاهده و گفتگو</span>
                </div>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 dark:text-violet-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allStaffRolesAllowed}
                    onChange={(e) => setAllStaffRolesAllowed(e.target.checked)}
                    className="rounded text-violet-600 focus:ring-violet-500"
                  />
                  <span>آزاد برای همه کارکنان دانشگاه</span>
                </label>
              </div>
              {!allStaffRolesAllowed && (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800">
                  {STAFF_ROLE_OPTIONS.map((opt) => {
                    const active = selectedStaffRoles.includes(opt.role);
                    return (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => toggleStaffRole(opt.role)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          active
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-violet-700/90 dark:text-violet-300/80">
                توجه: گروه‌های داخلی کارکنان به‌صورت خودکار پس از ثبت فعال می‌شوند و تحت نظارت مدیریت سامانه قرار دارند.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-white">
                <Users className="w-4 h-4 text-teal-600" />
                <span>تعیین دانشجویان مجاز به ورود و عضویت در تالار</span>
              </div>

              {/* نوع سکونت */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>وضعیت سکونت (خوابگاهی / ترددی):</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all' as const, label: 'همه دانشجویان' },
                    { value: 'dormitory' as const, label: 'فقط خوابگاهی' },
                    { value: 'commuter' as const, label: 'فقط ترددی' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAllowedResidence(opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        allowedResidence === opt.value
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* رشته‌های مجاز */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>رشته‌های تحصیلی مجاز:</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-700 dark:text-teal-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allFieldsAllowed}
                      onChange={(e) => setAllFieldsAllowed(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>آزاد برای همه رشته‌ها</span>
                  </label>
                </div>
                {!allFieldsAllowed && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {availableFields.map((field) => {
                        const active = selectedFields.includes(field);
                        return (
                          <button
                            key={field}
                            type="button"
                            onClick={() => toggleField(field)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                            }`}
                          >
                            {field}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customFieldInput}
                        onChange={(e) => setCustomFieldInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomField();
                          }
                        }}
                        placeholder="افزودن نام رشته دیگر..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                      <button
                        type="button"
                        onClick={addCustomField}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                      >
                        افزودن
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ورودی‌های مجاز */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    سال / نیمسال‌های ورودی مجاز:
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-700 dark:text-teal-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allEntryTermsAllowed}
                      onChange={(e) => setAllEntryTermsAllowed(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>آزاد برای همه ورودی‌ها</span>
                  </label>
                </div>
                {!allEntryTermsAllowed && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {availableEntryTerms.map((term) => {
                        const active = selectedEntryTerms.includes(term);
                        return (
                          <button
                            key={term}
                            type="button"
                            onClick={() => toggleEntryTerm(term)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              active
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            ورودی {term}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customEntryInput}
                        onChange={(e) => setCustomEntryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomEntry();
                          }
                        }}
                        placeholder="افزودن کد ورودی (مثلاً ۱۴۰۴)..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                      <button
                        type="button"
                        onClick={addCustomEntry}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                      >
                        افزودن
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isAdmin && audienceType === 'students_all' && (
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 cursor-pointer">
              <input
                type="checkbox"
                checked={directPublishByAdmin}
                onChange={(e) => setDirectPublishByAdmin(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                انتشار و فعال‌سازی مستقیم توسط مدیر سامانه (بدون نیاز به صف انتظار)
              </span>
            </label>
          )}

          {/* منشور اخلاقی و تعهدنامه اجباری */}
          <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>قوانین و تعهدنامه الزامی تشکیل تالار و گفتگو</span>
            </div>
            <div className="text-[11px] leading-6 text-amber-950/90 dark:text-amber-200/90 whitespace-pre-line bg-white/75 dark:bg-slate-900/60 p-3 rounded-xl border border-amber-200/70 dark:border-amber-800/60 max-h-36 overflow-y-auto">
              {chatSettings.rulesText}
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 shrink-0"
              />
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-5">
                متعهد می‌شوم در این تالار هیچ‌گونه بحث سیاسی، توهین، افترا یا محتوای خلاف قانون و شأن دانشجومعلمی منتشر نشود و نظارت کامل مدیر، معاونت دانشجویی و حراست را می‌پذیرم.
              </span>
            </label>
          </div>

          {/* دکمه‌های ارسال */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!rulesAccepted}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {audienceType === 'staff_only'
                  ? 'ایجاد و فعال‌سازی فوری گروه ویژه کارکنان'
                  : isAdmin && directPublishByAdmin
                  ? 'ایجاد و انتشار فوری تالار'
                  : 'ثبت درخواست جهت تأیید مدیر و حراست'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
