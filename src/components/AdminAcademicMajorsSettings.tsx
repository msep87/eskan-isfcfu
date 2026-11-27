import React, { useMemo, useState } from 'react';
import {
  AcademicDegreeLevel,
  AppSettings,
  ApprovedAcademicMajor,
  Student,
} from '../types';
import { Storage } from '../utils/storage';
import {
  DEFAULT_ACADEMIC_DEGREE_LEVELS,
  findClosestApprovedMajor,
  findExactApprovedMajorForStudent,
  formatApprovedMajorLabel,
  getEffectiveApprovedMajors,
  getEffectiveDegreeLevels,
  normalizeMajorCode,
  normalizeMajorText,
} from '../utils/academicMajors';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';

interface AdminAcademicMajorsSettingsProps {
  settings: AppSettings;
  students: Student[];
  onUpdateSettings: (updated: AppSettings) => void;
  onRefreshData: () => void;
}

type SubTabKey = 'majors' | 'levels' | 'standardize';

export const AdminAcademicMajorsSettings: React.FC<AdminAcademicMajorsSettingsProps> = ({
  settings,
  students,
  onUpdateSettings,
  onRefreshData,
}) => {
  const [subTab, setSubTab] = useState<SubTabKey>('majors');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const degreeLevels = useMemo(
    () => getEffectiveDegreeLevels(settings, true),
    [settings]
  );
  const activeDegreeLevels = useMemo(
    () => degreeLevels.filter((d) => d.isActive !== false),
    [degreeLevels]
  );
  const approvedMajors = useMemo(
    () => getEffectiveApprovedMajors(settings, true),
    [settings]
  );
  const activeApprovedMajors = useMemo(
    () => approvedMajors.filter((m) => m.isActive !== false),
    [approvedMajors]
  );

  // =========================================================================
  // ۱. فرم مدیریت مقاطع تحصیلی
  // =========================================================================
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelCode, setNewLevelCode] = useState('');
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [editLevelName, setEditLevelName] = useState('');
  const [editLevelCode, setEditLevelCode] = useState('');
  const [confirmDeleteLevelId, setConfirmDeleteLevelId] = useState<string | null>(null);

  const persistDegreeLevels = (nextLevels: AcademicDegreeLevel[], updatedMajors?: ApprovedAcademicMajor[]) => {
    const nextSettings: AppSettings = {
      ...settings,
      academicDegreeLevels: nextLevels,
      approvedMajors: updatedMajors ?? settings.approvedMajors ?? [],
    };
    onUpdateSettings(nextSettings);
  };

  const handleAddDegreeLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newLevelName.trim();
    const cleanCode = newLevelCode.trim();
    if (!cleanName) {
      setFeedback({ type: 'error', message: 'لطفاً عنوان مقطع تحصیلی را وارد نمایید.' });
      return;
    }
    if (degreeLevels.some((d) => normalizeMajorText(d.name) === normalizeMajorText(cleanName))) {
      setFeedback({ type: 'error', message: `مقطع «${cleanName}» قبلاً ثبت شده است.` });
      return;
    }
    const created: AcademicDegreeLevel = {
      id: `deg_${Date.now()}`,
      name: cleanName,
      code: cleanCode || undefined,
      isActive: true,
    };
    persistDegreeLevels([...degreeLevels, created]);
    setNewLevelName('');
    setNewLevelCode('');
    setFeedback({ type: 'success', message: `مقطع «${cleanName}» اضافه شد.` });
  };

  const handleSaveEditLevel = (id: string) => {
    const cleanName = editLevelName.trim();
    if (!cleanName) return;
    if (
      degreeLevels.some(
        (d) => d.id !== id && normalizeMajorText(d.name) === normalizeMajorText(cleanName)
      )
    ) {
      setFeedback({ type: 'error', message: `مقطع دیگری با عنوان «${cleanName}» وجود دارد.` });
      return;
    }
    const nextLevels = degreeLevels.map((d) =>
      d.id === id ? { ...d, name: cleanName, code: editLevelCode.trim() || undefined } : d
    );
    const nextMajors = (settings.approvedMajors || []).map((m) =>
      m.degreeLevelId === id ? { ...m, degreeLevelName: cleanName } : m
    );
    persistDegreeLevels(nextLevels, nextMajors);
    setEditingLevelId(null);
    setFeedback({ type: 'success', message: `عنوان مقطع به «${cleanName}» بروزرسانی شد.` });
  };

  const handleToggleLevelActive = (id: string) => {
    const nextLevels = degreeLevels.map((d) =>
      d.id === id ? { ...d, isActive: d.isActive === false } : d
    );
    persistDegreeLevels(nextLevels);
  };

  const handleDeleteLevel = (id: string) => {
    const usedByMajors = approvedMajors.filter((m) => m.degreeLevelId === id).length;
    if (usedByMajors > 0) {
      setFeedback({
        type: 'error',
        message: `این مقطع در ${usedByMajors} رشته مصوب استفاده شده است؛ ابتدا رشته‌های مرتبط را ویرایش کنید یا مقطع را غیرفعال نمایید.`,
      });
      setConfirmDeleteLevelId(null);
      return;
    }
    persistDegreeLevels(degreeLevels.filter((d) => d.id !== id));
    setConfirmDeleteLevelId(null);
    setFeedback({ type: 'success', message: 'مقطع تحصیلی حذف شد.' });
  };

  const handleRestoreDefaultLevels = () => {
    const existingNames = new Set(degreeLevels.map((d) => normalizeMajorText(d.name)));
    const additions = DEFAULT_ACADEMIC_DEGREE_LEVELS.filter(
      (def) => !existingNames.has(normalizeMajorText(def.name))
    );
    if (additions.length === 0) {
      setFeedback({ type: 'success', message: 'همه مقاطع پیش‌فرض دانشگاه در فهرست موجود هستند.' });
      return;
    }
    persistDegreeLevels([...degreeLevels, ...additions]);
    setFeedback({ type: 'success', message: `${additions.length} مقطع پیش‌فرض به فهرست افزوده شد.` });
  };

  // =========================================================================
  // ۲. فرم مدیریت رشته‌های مصوب و کد رشته
  // =========================================================================
  const [majorSearch, setMajorSearch] = useState('');
  const [majorLevelFilter, setMajorLevelFilter] = useState<string>('all');
  const [editingMajorId, setEditingMajorId] = useState<string | null>(null);
  const [majCode, setMajCode] = useState('');
  const [majName, setMajName] = useState('');
  const [majDegreeLevelId, setMajDegreeLevelId] = useState<string>(
    activeDegreeLevels[0]?.id || DEFAULT_ACADEMIC_DEGREE_LEVELS[0].id
  );
  const [majAliasesRaw, setMajAliasesRaw] = useState('');
  const [majActive, setMajActive] = useState(true);
  const [confirmDeleteMajorId, setConfirmDeleteMajorId] = useState<string | null>(null);

  const resetMajorForm = () => {
    setEditingMajorId(null);
    setMajCode('');
    setMajName('');
    setMajDegreeLevelId(activeDegreeLevels[0]?.id || degreeLevels[0]?.id || 'deg_ba_cont');
    setMajAliasesRaw('');
    setMajActive(true);
  };

  const startEditMajor = (m: ApprovedAcademicMajor) => {
    setEditingMajorId(m.id);
    setMajCode(m.code);
    setMajName(m.name);
    const foundLvl =
      degreeLevels.find((d) => d.id === m.degreeLevelId) ||
      degreeLevels.find((d) => normalizeMajorText(d.name) === normalizeMajorText(m.degreeLevelName));
    setMajDegreeLevelId(foundLvl?.id || activeDegreeLevels[0]?.id || '');
    setMajAliasesRaw((m.aliases || []).join('، '));
    setMajActive(m.isActive !== false);
  };

  const persistApprovedMajors = (nextMajors: ApprovedAcademicMajor[]) => {
    onUpdateSettings({
      ...settings,
      academicDegreeLevels: degreeLevels,
      approvedMajors: nextMajors,
    });
  };

  const handleSaveMajor = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeMajorCode(majCode);
    const cleanName = majName.trim();
    if (!cleanCode || !cleanName) {
      setFeedback({ type: 'error', message: 'لطفاً کد رشته و نام رسمی رشته را وارد نمایید.' });
      return;
    }

    const chosenLevel =
      degreeLevels.find((d) => d.id === majDegreeLevelId) ||
      activeDegreeLevels[0] ||
      DEFAULT_ACADEMIC_DEGREE_LEVELS[0];

    const dupCode = approvedMajors.find(
      (m) => m.id !== editingMajorId && normalizeMajorCode(m.code) === cleanCode
    );
    if (dupCode) {
      setFeedback({
        type: 'error',
        message: `کد رشته «${cleanCode}» قبلاً برای رشته «${dupCode.name}» ثبت شده است.`,
      });
      return;
    }

    const dupName = approvedMajors.find(
      (m) =>
        m.id !== editingMajorId &&
        normalizeMajorText(m.name) === normalizeMajorText(cleanName) &&
        normalizeMajorText(m.degreeLevelName) === normalizeMajorText(chosenLevel.name)
    );
    if (dupName) {
      setFeedback({
        type: 'error',
        message: `رشته «${cleanName}» در مقطع «${chosenLevel.name}» قبلاً ثبت شده است.`,
      });
      return;
    }

    const parsedAliases = Array.from(
      new Set(
        majAliasesRaw
          .split(/[,،\n]+/)
          .map((s) => s.trim())
          .filter((s) => s && normalizeMajorText(s) !== normalizeMajorText(cleanName))
      )
    );

    if (editingMajorId) {
      const next = approvedMajors.map((m) =>
        m.id === editingMajorId
          ? {
              ...m,
              code: cleanCode,
              name: cleanName,
              degreeLevelId: chosenLevel.id,
              degreeLevelName: chosenLevel.name,
              aliases: parsedAliases,
              isActive: majActive,
            }
          : m
      );
      persistApprovedMajors(next);
      setFeedback({ type: 'success', message: `رشته «${cleanName}» (کد ${cleanCode}) بروزرسانی شد.` });
      resetMajorForm();
    } else {
      const created: ApprovedAcademicMajor = {
        id: `maj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        code: cleanCode,
        name: cleanName,
        degreeLevelId: chosenLevel.id,
        degreeLevelName: chosenLevel.name,
        aliases: parsedAliases,
        isActive: majActive,
      };
      persistApprovedMajors([...approvedMajors, created]);
      setFeedback({ type: 'success', message: `رشته «${cleanName}» با کد ${cleanCode} ثبت شد.` });
      resetMajorForm();
    }
  };

  const handleToggleMajorActive = (id: string) => {
    persistApprovedMajors(
      approvedMajors.map((m) => (m.id === id ? { ...m, isActive: m.isActive === false } : m))
    );
  };

  const handleDeleteMajor = (id: string) => {
    persistApprovedMajors(approvedMajors.filter((m) => m.id !== id));
    setConfirmDeleteMajorId(null);
    if (editingMajorId === id) resetMajorForm();
    setFeedback({ type: 'success', message: 'رشته از فهرست رشته‌های مصوب حذف شد.' });
  };

  const handleImportMajorsFromScheduling = () => {
    const progs = Storage.getSchedPrograms();
    const crss = Storage.getSchedCourses();
    const candidates = [
      ...progs.map((p) => ({ code: normalizeMajorCode(p.majorCode), name: p.majorName.trim() })),
      ...crss.map((c) => ({ code: normalizeMajorCode(c.majorCode), name: c.majorName.trim() })),
    ].filter((x) => x.code && x.name);

    if (candidates.length === 0) {
      setFeedback({
        type: 'error',
        message: 'در برنامه جامع درسی هیچ کد و نام رشته‌ای یافت نشد.',
      });
      return;
    }

    const defaultLvl = activeDegreeLevels[0] || degreeLevels[0] || DEFAULT_ACADEMIC_DEGREE_LEVELS[0];
    const existingCodes = new Set(approvedMajors.map((m) => normalizeMajorCode(m.code)));
    const existingNames = new Set(approvedMajors.map((m) => normalizeMajorText(m.name)));
    const additions: ApprovedAcademicMajor[] = [];

    for (const cand of candidates) {
      if (existingCodes.has(cand.code) || existingNames.has(normalizeMajorText(cand.name))) continue;
      existingCodes.add(cand.code);
      existingNames.add(normalizeMajorText(cand.name));
      additions.push({
        id: `maj_sched_${Date.now()}_${additions.length}`,
        code: cand.code,
        name: cand.name,
        degreeLevelId: defaultLvl.id,
        degreeLevelName: defaultLvl.name,
        aliases: [],
        isActive: true,
      });
    }

    if (additions.length === 0) {
      setFeedback({
        type: 'success',
        message: 'تمام رشته‌های موجود در برنامه جامع درسی از قبل در فهرست مصوب ثبت شده‌اند.',
      });
      return;
    }

    persistApprovedMajors([...approvedMajors, ...additions]);
    setFeedback({
      type: 'success',
      message: `${additions.length} رشته جدید از داده‌های برنامه جامع درسی به فهرست مصوب اضافه شد.`,
    });
  };

  const filteredMajors = useMemo(() => {
    const q = normalizeMajorText(majorSearch);
    return approvedMajors.filter((m) => {
      if (majorLevelFilter !== 'all' && m.degreeLevelId !== majorLevelFilter) return false;
      if (!q) return true;
      const hay = normalizeMajorText(
        `${m.code} ${m.name} ${m.degreeLevelName} ${(m.aliases || []).join(' ')}`
      );
      return hay.includes(q);
    });
  }, [approvedMajors, majorLevelFilter, majorSearch]);

  // =========================================================================
  // ۳. ابزار هوشمند یکسان‌سازی داده‌های قدیمی دانشجویان
  // =========================================================================
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});
  const [stdFilter, setStdFilter] = useState<'all' | 'high' | 'review'>('all');
  const [syncEducationStaff, setSyncEducationStaff] = useState(true);
  const [syncScheduling, setSyncScheduling] = useState(true);
  const [syncRelatedRecords, setSyncRelatedRecords] = useState(true);
  const [saveAliases, setSaveAliases] = useState(true);

  const studentAudit = useMemo(() => {
    let standardizedCount = 0;
    const legacyGroupsMap = new Map<
      string,
      {
        key: string;
        rawField: string;
        sampleCodes: Set<string>;
        count: number;
      }
    >();

    for (const st of students) {
      const exact = findExactApprovedMajorForStudent(st, activeApprovedMajors);
      const exactComplete =
        exact &&
        normalizeMajorCode(st.majorCode) === normalizeMajorCode(exact.code) &&
        (!exact.degreeLevelName || st.degreeLevel === exact.degreeLevelName);
      if (exactComplete) {
        standardizedCount++;
        continue;
      }

      const rawField = (st.fieldOfStudy || '').trim() || '(بدون رشته)';
      const groupKey = rawField;
      let grp = legacyGroupsMap.get(groupKey);
      if (!grp) {
        grp = {
          key: groupKey,
          rawField,
          sampleCodes: new Set<string>(),
          count: 0,
        };
        legacyGroupsMap.set(groupKey, grp);
      }
      grp.count++;
      if (st.majorCode) grp.sampleCodes.add(normalizeMajorCode(st.majorCode));
    }

    const legacyGroups = Array.from(legacyGroupsMap.values())
      .map((grp) => {
        const sampleCode = Array.from(grp.sampleCodes)[0];
        const suggestion =
          grp.rawField === '(بدون رشته)'
            ? null
            : findClosestApprovedMajor(grp.rawField, activeApprovedMajors, sampleCode);
        const suggestedMajorId = suggestion ? suggestion.major.id : '';
        const selectedTargetId =
          manualOverrides[grp.key] !== undefined ? manualOverrides[grp.key] : suggestedMajorId;
        return {
          ...grp,
          sampleCode,
          suggestion,
          selectedTargetId,
        };
      })
      .sort((a, b) => b.count - a.count || a.rawField.localeCompare(b.rawField, 'fa'));

    const unstandardizedStudentsCount = students.length - standardizedCount;
    return {
      totalStudents: students.length,
      standardizedCount,
      unstandardizedStudentsCount,
      legacyGroups,
    };
  }, [students, activeApprovedMajors, manualOverrides]);

  const visibleLegacyGroups = useMemo(() => {
    return studentAudit.legacyGroups.filter((grp) => {
      if (stdFilter === 'high') return (grp.suggestion?.score ?? 0) >= 65;
      if (stdFilter === 'review') return (grp.suggestion?.score ?? 0) < 65;
      return true;
    });
  }, [studentAudit.legacyGroups, stdFilter]);

  const readyToConvertCount = useMemo(() => {
    return studentAudit.legacyGroups.reduce(
      (acc, g) => (g.selectedTargetId ? acc + g.count : acc),
      0
    );
  }, [studentAudit.legacyGroups]);

  const handleExecuteStandardization = () => {
    if (activeApprovedMajors.length === 0) {
      setFeedback({
        type: 'error',
        message: 'ابتدا باید حداقل یک رشته مصوب با کد رشته در تب «رشته‌های مصوب» ثبت کنید.',
      });
      return;
    }

    const mappings = studentAudit.legacyGroups
      .filter((g) => g.selectedTargetId && g.rawField !== '(بدون رشته)')
      .map((g) => ({
        legacyText: g.rawField,
        targetMajorId: g.selectedTargetId,
      }));

    if (mappings.length === 0) {
      setFeedback({
        type: 'error',
        message: 'هیچ نگاشتی برای تبدیل انتخاب نشده است. لطفاً برای رشته‌های ناهمگون، رشته مصوب مقصد را تعیین کنید.',
      });
      return;
    }

    const res = Storage.standardizeLegacyAcademicMajors({
      mappings,
      syncEducationStaff,
      syncScheduling,
      syncRelatedRecords,
      saveAliases,
    });

    const refreshedSettings = Storage.getSettings();
    onUpdateSettings(refreshedSettings);
    onRefreshData();
    setManualOverrides({});

    setFeedback({
      type: 'success',
      message: `یکسان‌سازی با موفقیت انجام شد: ${res.updatedStudentsCount} دانشجو، ${res.updatedStaffCount} کاربر آموزش، ${
        res.updatedProgramsCount + res.updatedCoursesCount + res.updatedOfferingsCount
      } رکورد برنامه درسی و ${res.updatedRelatedCount} سابقه مرتبط استانداردسازی شدند.`,
    });
  };

  const selectedGroupsOnlyHigh = () => {
    const next: Record<string, string> = {};
    studentAudit.legacyGroups.forEach((g) => {
      if ((g.suggestion?.score ?? 0) >= 70 && g.suggestion?.major.id) {
        next[g.key] = g.suggestion.major.id;
      } else {
        next[g.key] = '';
      }
    });
    setManualOverrides(next);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      {/* هدر بخش */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-sm shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              مدیریت مقاطع و رشته‌های تحصیلی مصوب دانشگاه (با کد رشته)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              پس از ثبت رشته‌ها و کدهای رسمی در این بخش، انتخاب رشته برای{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                دانشجویان، کارشناسان آموزش، مدیران گروه، برنامه جامع درسی و بارگذاری اکسل
              </span>{' '}
              فقط از همین فهرست انجام می‌شود.{' '}
              <span className="font-bold text-teal-700 dark:text-teal-300">
                (رشته مدرک تحصیلی اساتید از این قاعده مستثنی و آزاد است.)
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
            مقاطع فعال: {activeDegreeLevels.length}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-xs font-extrabold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            رشته‌های مصوب: {activeApprovedMajors.length}
          </div>
          {studentAudit.unstandardizedStudentsCount > 0 && approvedMajors.length > 0 && (
            <button
              type="button"
              onClick={() => setSubTab('standardize')}
              className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:bg-amber-100"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{studentAudit.unstandardizedStudentsCount} دانشجوی نیازمند یکسان‌سازی</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
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

      {/* زیرتب‌ها */}
      <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setSubTab('majors')}
          className={`flex-1 min-w-[170px] px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'majors'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>۱. رشته‌های مصوب و کد رشته ({approvedMajors.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('levels')}
          className={`flex-1 min-w-[150px] px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'levels'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>۲. مقاطع تحصیلی ({degreeLevels.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('standardize')}
          className={`flex-1 min-w-[200px] px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'standardize'
              ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>
            ۳. یکسان‌سازی داده‌های قبلی دانشجویان ({studentAudit.legacyGroups.length} مورد)
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* تب ۱: مدیریت رشته‌های مصوب با کد رشته                               */}
      {/* ===================================================================== */}
      {subTab === 'majors' && (
        <div className="space-y-5">
          <form
            onSubmit={handleSaveMajor}
            className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/70 space-y-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                {editingMajorId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>
                  {editingMajorId ? 'ویرایش رشته مصوب' : 'ثبت رشته تحصیلی مصوب جدید'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportMajorsFromScheduling}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>استخراج خودکار از برنامه جامع درسی</span>
                </button>
                {editingMajorId && (
                  <button
                    type="button"
                    onClick={resetMajorForm}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold cursor-pointer"
                  >
                    انصراف از ویرایش
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  کد رشته مصوب *
                </label>
                <input
                  type="text"
                  value={majCode}
                  onChange={(e) => setMajCode(e.target.value)}
                  placeholder="مثلاً 110101"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام رسمی رشته تحصیلی *
                </label>
                <input
                  type="text"
                  value={majName}
                  onChange={(e) => setMajName(e.target.value)}
                  placeholder="مثلاً آموزش ابتدایی"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مقطع تحصیلی *
                </label>
                <select
                  value={majDegreeLevelId}
                  onChange={(e) => setMajDegreeLevelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {(activeDegreeLevels.length > 0 ? activeDegreeLevels : degreeLevels).map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
              <div className="lg:col-span-3">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نگارش‌های مشابه / عناوین جایگزین در فایل‌های قدیمی (اختیاری - با ویرگول جدا کنید)
                </label>
                <input
                  type="text"
                  value={majAliasesRaw}
                  onChange={(e) => setMajAliasesRaw(e.target.value)}
                  placeholder="مثلاً: اموزش ابتدایی، ابتدایی پیوسته، آموزش و پرورش ابتدایی"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={majActive}
                    onChange={(e) => setMajActive(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>فعال</span>
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingMajorId ? 'ذخیره تغییرات' : 'افزودن رشته'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* جستجو و فیلتر جدول رشته‌ها */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                value={majorSearch}
                onChange={(e) => setMajorSearch(e.target.value)}
                placeholder="جستجو بر اساس کد رشته، نام یا مقطع..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
            <select
              value={majorLevelFilter}
              onChange={(e) => setMajorLevelFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="all">همه مقاطع تحصیلی ({approvedMajors.length})</option>
              {degreeLevels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          {filteredMajors.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                هنوز هیچ رشته مصوبی در این نما ثبت نشده است
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                رشته‌های مصوب دانشگاه را همراه با کد رشته و مقطع تحصیلی از فرم بالا ثبت کنید تا در
                تمام بخش‌های ثبت دانشجو، کارشناس آموزش، مدیر گروه و برنامه درسی صرفاً همین رشته‌ها قابل انتخاب باشند.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">کد رشته</th>
                    <th className="p-3">نام رسمی رشته</th>
                    <th className="p-3">مقطع تحصیلی</th>
                    <th className="p-3">تعداد دانشجو</th>
                    <th className="p-3">عناوین جایگزین</th>
                    <th className="p-3">وضعیت</th>
                    <th className="p-3 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMajors.map((m) => {
                    const matchedCount = students.filter(
                      (st) =>
                        normalizeMajorCode(st.majorCode) === normalizeMajorCode(m.code) ||
                        st.fieldOfStudy.trim() === m.name.trim()
                    ).length;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-extrabold text-teal-700 dark:text-teal-300" dir="ltr">
                          {m.code}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{m.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                            {m.degreeLevelName}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                          {matchedCount} نفر
                        </td>
                        <td className="p-3 max-w-[220px]">
                          {(m.aliases || []).length > 0 ? (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {m.aliases!.join('، ')}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleMajorActive(m.id)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${
                              m.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {m.isActive !== false ? 'فعال' : 'غیرفعال'}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditMajor(m)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 text-slate-600 hover:text-teal-700 cursor-pointer"
                              title="ویرایش"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteMajorId === m.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMajor(m.id)}
                                  className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  تأیید حذف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteMajorId(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                                >
                                  لغو
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteMajorId(m.id)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-600 hover:text-rose-600 cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* تب ۲: مدیریت مقاطع تحصیلی                                            */}
      {/* ===================================================================== */}
      {subTab === 'levels' && (
        <div className="space-y-4">
          <form
            onSubmit={handleAddDegreeLevel}
            className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/70 flex flex-wrap items-end gap-3 text-xs"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان مقطع تحصیلی جدید *
              </label>
              <input
                type="text"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="مثلاً کارشناسی پیوسته، کارشناسی ارشد..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                required
              />
            </div>
            <div className="w-36">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                کد اختصاری (اختیاری)
              </label>
              <input
                type="text"
                value={newLevelCode}
                onChange={(e) => setNewLevelCode(e.target.value)}
                placeholder="BA / MA"
                dir="ltr"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن مقطع</span>
            </button>
            <button
              type="button"
              onClick={handleRestoreDefaultLevels}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بازیابی مقاطع پیش‌فرض</span>
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            {degreeLevels.map((lvl) => {
              const majorCount = approvedMajors.filter(
                (m) =>
                  m.degreeLevelId === lvl.id ||
                  normalizeMajorText(m.degreeLevelName) === normalizeMajorText(lvl.name)
              ).length;
              const isEditing = editingLevelId === lvl.id;
              return (
                <div
                  key={lvl.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editLevelName}
                        onChange={(e) => setEditLevelName(e.target.value)}
                        className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg border border-indigo-400 bg-white dark:bg-slate-900"
                      />
                      <input
                        type="text"
                        value={editLevelCode}
                        onChange={(e) => setEditLevelCode(e.target.value)}
                        placeholder="کد"
                        dir="ltr"
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditLevel(lvl.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLevelId(null)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="truncate">{lvl.name}</span>
                          {lvl.code && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">
                              {lvl.code}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {majorCount} رشته مصوب زیرمجموعه
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleLevelActive(lvl.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                            lvl.isActive !== false
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {lvl.isActive !== false ? 'فعال' : 'غیرفعال'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLevelId(lvl.id);
                            setEditLevelName(lvl.name);
                            setEditLevelCode(lvl.code || '');
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-indigo-600 cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteLevelId === lvl.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteLevel(lvl.id)}
                              className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                            >
                              حذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteLevelId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                            >
                              لغو
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteLevelId(lvl.id)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-rose-600 cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* تب ۳: ابزار هوشمند یکسان‌سازی داده‌های قدیمی دانشجویان                */}
      {/* ===================================================================== */}
      {subTab === 'standardize' && (
        <div className="space-y-4">
          {/* کارت آمار وضعیت */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400">کل دانشجویان سامانه</div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {studentAudit.totalStudents} نفر
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800">
              <div className="text-emerald-700 dark:text-emerald-300">
                دارای رشته و کد مصوب استاندارد
              </div>
              <div className="text-lg font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
                {studentAudit.standardizedCount} نفر
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800">
              <div className="text-amber-800 dark:text-amber-300">
                دارای نگارش قدیمی / بدون کد رشته مصوب
              </div>
              <div className="text-lg font-black text-amber-900 dark:text-amber-200 mt-0.5">
                {studentAudit.unstandardizedStudentsCount} نفر ({studentAudit.legacyGroups.length} عنوان)
              </div>
            </div>
          </div>

          {activeApprovedMajors.length === 0 ? (
            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
              <div className="font-bold">
                برای اجرای یکسان‌سازی، ابتدا باید رشته‌های مصوب و کد رشته آن‌ها را در تب «رشته‌های مصوب و کد رشته» ثبت کنید.
              </div>
              <button
                type="button"
                onClick={() => setSubTab('majors')}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold cursor-pointer"
              >
                رفتن به ثبت رشته‌های مصوب
              </button>
            </div>
          ) : studentAudit.legacyGroups.length === 0 ? (
            <div className="p-8 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                تمام دانشجویان سامانه دارای نام رشته مصوب، کد رشته و مقطع استاندارد هستند.
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { key: 'all', label: `همه موارد (${studentAudit.legacyGroups.length})` },
                        {
                          key: 'high',
                          label: `تطبیق بالا ۶۵٪+ (${
                            studentAudit.legacyGroups.filter((g) => (g.suggestion?.score ?? 0) >= 65)
                              .length
                          })`,
                        },
                        {
                          key: 'review',
                          label: `نیازمند بررسی دستی (${
                            studentAudit.legacyGroups.filter((g) => (g.suggestion?.score ?? 0) < 65)
                              .length
                          })`,
                        },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setStdFilter(f.key)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                          stdFilter === f.key
                            ? 'bg-teal-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={selectedGroupsOnlyHigh}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      فقط انتخاب تطبیق‌های بالای ۷۰٪
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualOverrides({})}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      بازنشانی پیشنهادهای هوشمند
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={syncEducationStaff}
                      onChange={(e) => setSyncEducationStaff(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600"
                    />
                    <span>بروزرسانی کارشناسان و مدیران گروه</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={syncScheduling}
                      onChange={(e) => setSyncScheduling(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600"
                    />
                    <span>همگام‌سازی برنامه جامع درسی</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={syncRelatedRecords}
                      onChange={(e) => setSyncRelatedRecords(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600"
                    />
                    <span>بروزرسانی سوابق آموزشی و پیام‌ها</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={saveAliases}
                      onChange={(e) => setSaveAliases(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600"
                    />
                    <span>ثبت نگارش‌های قدیمی به‌عنوان Alias</span>
                  </label>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto max-h-[420px]">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-3">عنوان فعلی ثبت‌شده در پرونده دانشجویان</th>
                      <th className="p-3">تعداد دانشجو</th>
                      <th className="p-3">درجه شباهت هوشمند</th>
                      <th className="p-3">تبدیل به رشته مصوب مقصد (همراه با کد رشته)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visibleLegacyGroups.map((grp) => {
                      const score = grp.suggestion?.score ?? 0;
                      const badgeCls =
                        score >= 85
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : score >= 60
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
                      return (
                        <tr key={grp.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {grp.rawField}
                            </div>
                            {grp.sampleCode && (
                              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                کد فعلی ثبت‌شده: {grp.sampleCode}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-extrabold text-slate-700 dark:text-slate-200">
                            {grp.count} نفر
                          </td>
                          <td className="p-3">
                            {grp.suggestion ? (
                              <div className="space-y-0.5">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeCls}`}
                                >
                                  {score}% شباهت
                                </span>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {grp.suggestion.reason}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">بدون پیشنهاد</span>
                            )}
                          </td>
                          <td className="p-3 min-w-[260px]">
                            <select
                              value={grp.selectedTargetId}
                              onChange={(e) =>
                                setManualOverrides((prev) => ({
                                  ...prev,
                                  [grp.key]: e.target.value,
                                }))
                              }
                              className={`w-full px-3 py-2 rounded-xl border text-xs ${
                                grp.selectedTargetId
                                  ? 'border-teal-400 dark:border-teal-700 bg-white dark:bg-slate-900 font-bold'
                                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              <option value="">-- عدم تغییر (رد کردن این عنوان) --</option>
                              {activeApprovedMajors.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {formatApprovedMajorLabel(m)}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  تعداد پرونده‌های آماده تبدیل و کدگذاری:{' '}
                  <span className="font-black text-teal-700 dark:text-teal-300">
                    {readyToConvertCount} دانشجو
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteStandardization}
                  disabled={readyToConvertCount === 0}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>اجرای یکسان‌سازی و ثبت کد رشته روی دانشجویان انتخاب‌شده</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
