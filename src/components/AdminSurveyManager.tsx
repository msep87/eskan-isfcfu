import React, { useMemo, useState } from 'react';
import {
  AppSettings,
  Dormitory,
  MaintenanceStaff,
  PeriodicSurvey,
  Supervisor,
  SurveyCategory,
  SurveyFrequency,
  SurveyQuestion,
  SurveyQuestionType,
  SurveyResponse,
} from '../types';
import { Storage } from '../utils/storage';
import {
  SURVEY_CATEGORY_LABELS,
  SURVEY_FREQUENCY_LABELS,
  exportAllSurveysSummaryToExcel,
  exportSurveyResultsToExcel,
} from '../utils/excelUtils';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  Edit3,
  EyeOff,
  FileSpreadsheet,
  Lock,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Unlock,
  UserCheck,
  Utensils,
  Wrench,
  X,
} from 'lucide-react';

interface AdminSurveyManagerProps {
  dorms: Dormitory[];
  supervisors: Supervisor[];
  maintenanceStaff: MaintenanceStaff[];
  settings: AppSettings;
  onRefreshData: () => void;
}

const buildTemplateQuestions = (category: SurveyCategory): SurveyQuestion[] => {
  const uid = (suffix: string) => `q_${category}_${suffix}_${Math.random().toString(36).slice(2, 6)}`;

  if (category === 'dorm_services') {
    return [
      {
        id: uid('1'),
        text: 'میزان رضایت شما از نظافت عمومی راهروها، سرویس‌های بهداشتی و حمام سرا چگونه است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'cleanliness',
      },
      {
        id: uid('2'),
        text: 'سرعت و کیفیت رفع خرابی‌های تأسیساتی (گرمایش، آب، برق و شیرآلات) در سرا را چگونه ارزیابی می‌کنید؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'facilities',
      },
      {
        id: uid('3'),
        text: 'وضعیت جمع‌آوری زباله، ضدعفونی و بهداشت محیط آشپزخانه و فضاهای مشترک سرا چطور است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'cleanliness',
      },
      {
        id: uid('4'),
        text: 'مهم‌ترین اولویت بهبود خدمات در سرای شما کدام مورد است؟',
        type: 'choice',
        required: true,
        options: ['بهبود نظافت و بهداشت', 'تسریع تعمیرات تأسیساتی', 'بهسازی تجهیزات اتاق‌ها', 'بهبود سیستم گرمایش/سرمایش'],
        aspectTag: 'general',
      },
      {
        id: uid('5'),
        text: 'پیشنهاد یا گزارش موردی درباره خدمات نظافت و تأسیسات سرا (اختیاری):',
        type: 'text',
        required: false,
        aspectTag: 'general',
      },
    ];
  }

  if (category === 'cleanliness') {
    return [
      {
        id: uid('1'),
        text: 'نظافت روزانه راهروها، پله‌ها و سالن‌های عمومی سرا در چه سطحی است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'cleanliness',
      },
      {
        id: uid('2'),
        text: 'بهداشت و نظافت سرویس‌های بهداشتی و حمام‌های سرا را چگونه ارزیابی می‌کنید؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'cleanliness',
      },
      {
        id: uid('3'),
        text: 'تأمین مواد شوینده، سطل‌های زباله و نظم تخلیه پسماند در سرا چگونه است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'cleanliness',
      },
      {
        id: uid('4'),
        text: 'توضیحات یا نقاط نیازمند رسیدگی فوری در حوزه نظافت سرا:',
        type: 'text',
        required: false,
        aspectTag: 'cleanliness',
      },
    ];
  }

  if (category === 'maintenance') {
    return [
      {
        id: uid('1'),
        text: 'سرعت حضور و پاسخگویی واحد تأسیسات پس از ثبت خرابی چقدر رضایت‌بخش بوده است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'facilities',
      },
      {
        id: uid('2'),
        text: 'کیفیت فنی تعمیرات انجام‌شده (لوله‌کشی، برق، گرمایش/سرمایش، قفل و نجاری) را چگونه ارزیابی می‌کنید؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'facilities',
      },
      {
        id: uid('3'),
        text: 'برخورد حرفه‌ای و رعایت شئونات خوابگاهی توسط پرسنل تأسیسات هنگام مراجعه چگونه بوده است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'facilities',
      },
      {
        id: uid('4'),
        text: 'در کدام بخش تأسیساتی سرا بیشترین نیاز به تعمیر یا نوسازی وجود دارد؟',
        type: 'choice',
        required: true,
        options: ['تأسیسات آب و لوله‌کشی', 'برق و روشنایی', 'سیستم گرمایش و موتورخانه', 'سیستم سرمایش', 'در، پنجره و قفل'],
        aspectTag: 'facilities',
      },
      {
        id: uid('5'),
        text: 'اگر نقص تکراری یا تعمیر ناتمام وجود دارد شرح دهید:',
        type: 'text',
        required: false,
        aspectTag: 'facilities',
      },
    ];
  }

  if (category === 'cafeteria') {
    return [
      {
        id: uid('1'),
        text: 'کیفیت طعم، پخت و دمای غذای ارائه‌شده در سلف سرویس را چگونه ارزیابی می‌کنید؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'cafeteria',
      },
      {
        id: uid('2'),
        text: 'تنوع برنامه غذایی هفتگی و کیفیت مواد اولیه و مخلفات غذا چطور است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'cafeteria',
      },
      {
        id: uid('3'),
        text: 'بهداشت محیط سلف، تمیزی سینی/ظروف و نحوه توزیع غذا را چگونه ارزیابی می‌کنید؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'cafeteria',
      },
      {
        id: uid('4'),
        text: 'کیفیت وعده صبحانه، شام و بسته‌های تغذیه خوابگاهی چطور بوده است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'cafeteria',
      },
      {
        id: uid('5'),
        text: 'کدام وعده یا غذای سلف بیش از همه نیازمند اصلاح کیفیت است؟',
        type: 'text',
        required: false,
        aspectTag: 'cafeteria',
      },
    ];
  }

  if (category === 'supervisors') {
    return [
      {
        id: uid('1'),
        text: 'نحوه برخورد، احترام و تکریم دانشجومعلمان توسط سرپرست سرا چگونه است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'supervisor',
      },
      {
        id: uid('2'),
        text: 'میزان حضور به‌موقع، دسترس‌پذیری و پیگیری مشکلات دانشجویان توسط سرپرست چطور است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'supervisor',
      },
      {
        id: uid('3'),
        text: 'دقت، انصاف و بی‌طرفی سرپرست در اجرای مقررات خوابگاه را چگونه ارزیابی می‌کنید؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'supervisor',
      },
      {
        id: uid('4'),
        text: 'میزان رضایت کلی شما از عملکرد سرپرست سرا در این دوره چقدر است؟',
        type: 'rating_5',
        required: true,
        aspectTag: 'supervisor',
      },
      {
        id: uid('5'),
        text: 'نقاط قوت یا پیشنهادهای سازنده جهت ارتقای عملکرد سرپرستی:',
        type: 'text',
        required: false,
        aspectTag: 'supervisor',
      },
    ];
  }

  // comprehensive
  return [
    {
      id: uid('1'),
      text: 'رضایت از وضعیت نظافت و بهداشت فضاهای عمومی سرای دانشجویی:',
      type: 'rating_5',
      required: true,
      aspectTag: 'cleanliness',
    },
    {
      id: uid('2'),
      text: 'رضایت از عملکرد واحد تأسیسات و سرعت رفع خرابی‌ها:',
      type: 'rating_5',
      required: true,
      aspectTag: 'facilities',
    },
    {
      id: uid('3'),
      text: 'رضایت از کیفیت، طعم و بهداشت غذاهای سلف سرویس:',
      type: 'rating_5',
      required: true,
      aspectTag: 'cafeteria',
    },
    {
      id: uid('4'),
      text: 'رضایت از نحوه تعامل و پیگیری امور توسط سرپرست سرا:',
      type: 'rating_5',
      required: true,
      aspectTag: 'supervisor',
    },
    {
      id: uid('5'),
      text: 'مهم‌ترین پیشنهاد شما برای بهبود کیفیت زندگی خوابگاهی در دوره آتی:',
      type: 'text',
      required: false,
      aspectTag: 'general',
    },
  ];
};

const DEFAULT_TITLE_BY_CATEGORY: Record<SurveyCategory, string> = {
  dorm_services: 'نظرسنجی دوره‌ای کیفیت خدمات سراها (تأسیسات و نظافت)',
  cleanliness: 'نظرسنجی ارزیابی وضعیت نظافت و بهداشت سراها',
  maintenance: 'نظرسنجی ارزیابی عملکرد واحد تأسیسات و تعمیرات',
  cafeteria: 'نظرسنجی دوره‌ای کیفیت غذاهای سلف و تغذیه دانشجویی',
  supervisors: 'نظرسنجی دوره‌ای ارزیابی عملکرد سرپرستان سراها',
  comprehensive: 'نظرسنجی جامع کیفیت خدمات سرا، تأسیسات، نظافت، سلف و سرپرستی',
};

export const AdminSurveyManager: React.FC<AdminSurveyManagerProps> = ({
  dorms,
  supervisors,
  maintenanceStaff,
  settings,
  onRefreshData,
}) => {
  const [surveys, setSurveys] = useState<PeriodicSurvey[]>(() => Storage.getSurveys());
  const [responses, setResponses] = useState<SurveyResponse[]>(() => Storage.getSurveyResponses());

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null);
  const [selectedAnalyticsSurveyId, setSelectedAnalyticsSurveyId] = useState<string | null>(
    () => Storage.getSurveys()[0]?.id || null
  );

  const [filterCategory, setFilterCategory] = useState<'all' | SurveyCategory>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed' | 'draft'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteTargetSurvey, setDeleteTargetSurvey] = useState<PeriodicSurvey | null>(null);

  // فرم سازنده نظرسنجی
  const [category, setCategory] = useState<SurveyCategory>('dorm_services');
  const [title, setTitle] = useState(DEFAULT_TITLE_BY_CATEGORY.dorm_services);
  const [description, setDescription] = useState(
    'با مشارکت در این نظرسنجی دوره‌ای، مدیریت سراها را در ارتقای کیفیت خدمات خوابگاهی یاری فرمایید.'
  );
  const [frequency, setFrequency] = useState<SurveyFrequency>('monthly');
  const [periodLabel, setPeriodLabel] = useState(
    `${settings.currentSemester || 'نیمسال اول'} ${settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶'}`
  );
  const [targetDormId, setTargetDormId] = useState<string>('all');
  const [targetSupervisorId, setTargetSupervisorId] = useState<string>('all');
  const [targetMaintenanceId, setTargetMaintenanceId] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => new Date().toLocaleDateString('fa-IR'));
  const [endDate, setEndDate] = useState('۱۴۰۵/۱۲/۲۹');
  const [status, setStatus] = useState<PeriodicSurvey['status']>('active');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [questions, setQuestions] = useState<SurveyQuestion[]>(() =>
    buildTemplateQuestions('dorm_services')
  );

  // افزودن سوال جدید سفارشی در سازنده
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<SurveyQuestionType>('rating_5');
  const [newQuestionOptionsRaw, setNewQuestionOptionsRaw] = useState('');
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);

  const reloadLocal = () => {
    setSurveys(Storage.getSurveys());
    setResponses(Storage.getSurveyResponses());
    onRefreshData();
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const applyPresetCategory = (cat: SurveyCategory, replaceQuestions: boolean) => {
    setCategory(cat);
    if (!editingSurveyId) {
      setTitle(DEFAULT_TITLE_BY_CATEGORY[cat]);
    }
    if (replaceQuestions) {
      setQuestions(buildTemplateQuestions(cat));
    }
  };

  const resetBuilder = () => {
    setEditingSurveyId(null);
    setCategory('dorm_services');
    setTitle(DEFAULT_TITLE_BY_CATEGORY.dorm_services);
    setDescription(
      'با مشارکت در این نظرسنجی دوره‌ای، مدیریت سراها را در ارتقای کیفیت خدمات خوابگاهی یاری فرمایید.'
    );
    setFrequency('monthly');
    setPeriodLabel(`${settings.currentSemester || 'نیمسال اول'} ${settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶'}`);
    setTargetDormId('all');
    setTargetSupervisorId('all');
    setTargetMaintenanceId('all');
    setStartDate(new Date().toLocaleDateString('fa-IR'));
    setEndDate('۱۴۰۵/۱۲/۲۹');
    setStatus('active');
    setIsAnonymous(true);
    setQuestions(buildTemplateQuestions('dorm_services'));
    setNewQuestionText('');
    setNewQuestionOptionsRaw('');
    setShowBuilder(false);
  };

  const handleStartEditSurvey = (srv: PeriodicSurvey) => {
    setEditingSurveyId(srv.id);
    setCategory(srv.category);
    setTitle(srv.title);
    setDescription(srv.description || '');
    setFrequency(srv.frequency);
    setPeriodLabel(srv.periodLabel);
    setTargetDormId(srv.targetDormId || 'all');
    setTargetSupervisorId(srv.targetSupervisorId || 'all');
    setTargetMaintenanceId(srv.targetMaintenanceId || 'all');
    setStartDate(srv.startDate);
    setEndDate(srv.endDate);
    setStatus(srv.status);
    setIsAnonymous(Boolean(srv.isAnonymous));
    setQuestions(srv.questions.map((q) => ({ ...q, options: q.options ? [...q.options] : undefined })));
    setShowBuilder(true);
  };

  const handleAddCustomQuestion = () => {
    const cleanText = newQuestionText.trim();
    if (!cleanText) {
      showToast('error', 'لطفاً متن سوال جدید را وارد نمایید.');
      return;
    }
    let parsedOptions: string[] | undefined;
    if (newQuestionType === 'choice') {
      parsedOptions = newQuestionOptionsRaw
        .split(/[\n،,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsedOptions.length < 2) {
        showToast('error', 'برای سوال چندگزینه‌ای حداقل ۲ گزینه (جداشده با کاما یا خط جدید) وارد نمایید.');
        return;
      }
    }
    const q: SurveyQuestion = {
      id: `q_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: cleanText,
      type: newQuestionType,
      required: newQuestionRequired,
      options: parsedOptions,
      aspectTag:
        category === 'cafeteria'
          ? 'cafeteria'
          : category === 'supervisors'
          ? 'supervisor'
          : category === 'maintenance'
          ? 'facilities'
          : category === 'cleanliness'
          ? 'cleanliness'
          : 'general',
    };
    setQuestions((prev) => [...prev, q]);
    setNewQuestionText('');
    setNewQuestionOptionsRaw('');
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleSaveSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('error', 'عنوان نظرسنجی نمی‌تواند خالی باشد.');
      return;
    }
    const cleanedQuestions = questions.filter((q) => q.text.trim().length > 0);
    if (cleanedQuestions.length === 0) {
      showToast('error', 'حداقل یک سوال معتبر باید در نظرسنجی وجود داشته باشد.');
      return;
    }

    const supObj =
      targetSupervisorId && targetSupervisorId !== 'all'
        ? supervisors.find((s) => s.id === targetSupervisorId)
        : undefined;
    const maintObj =
      targetMaintenanceId && targetMaintenanceId !== 'all'
        ? maintenanceStaff.find((m) => m.id === targetMaintenanceId)
        : undefined;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      frequency,
      periodLabel: periodLabel.trim() || 'دوره‌ای',
      targetDormId,
      targetSupervisorId:
        category === 'supervisors' || category === 'comprehensive' ? targetSupervisorId : undefined,
      targetSupervisorName: supObj ? supObj.fullName : undefined,
      targetMaintenanceId:
        category === 'maintenance' || category === 'dorm_services' || category === 'comprehensive'
          ? targetMaintenanceId
          : undefined,
      targetMaintenanceName: maintObj ? `${maintObj.fullName} (${maintObj.specialty})` : undefined,
      startDate: startDate.trim() || new Date().toLocaleDateString('fa-IR'),
      endDate: endDate.trim() || 'نامحدود',
      status,
      isAnonymous,
      questions: cleanedQuestions,
      createdBy: 'مدیریت کل سامانه',
    };

    if (editingSurveyId) {
      const res = Storage.updateSurvey(editingSurveyId, payload);
      showToast(res.success ? 'success' : 'error', res.message);
      setSelectedAnalyticsSurveyId(editingSurveyId);
    } else {
      const res = Storage.addSurvey(payload);
      showToast(res.success ? 'success' : 'error', res.message);
      if (res.survey) setSelectedAnalyticsSurveyId(res.survey.id);
    }

    resetBuilder();
    reloadLocal();
  };

  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      return true;
    });
  }, [surveys, filterCategory, filterStatus]);

  const selectedSurvey = useMemo(
    () => surveys.find((s) => s.id === selectedAnalyticsSurveyId) || filteredSurveys[0] || null,
    [surveys, filteredSurveys, selectedAnalyticsSurveyId]
  );

  const selectedResponses = useMemo(
    () => (selectedSurvey ? responses.filter((r) => r.surveyId === selectedSurvey.id) : []),
    [responses, selectedSurvey]
  );

  const totalResponsesCount = responses.length;
  const activeSurveysCount = surveys.filter((s) => s.status === 'active').length;

  const getCategoryIcon = (cat: SurveyCategory) => {
    if (cat === 'cafeteria') return <Utensils className="w-4 h-4 text-orange-600" />;
    if (cat === 'supervisors') return <UserCheck className="w-4 h-4 text-indigo-600" />;
    if (cat === 'maintenance') return <Wrench className="w-4 h-4 text-amber-600" />;
    if (cat === 'cleanliness') return <Sparkles className="w-4 h-4 text-emerald-600" />;
    if (cat === 'dorm_services') return <Building2 className="w-4 h-4 text-teal-600" />;
    return <ClipboardList className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* نوار پیام بازخورد */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* کارت سربرگ و آمار کل نظرسنجی‌ها */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500/15 to-indigo-500/15 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/50">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                سامانه نظرسنجی‌های دوره‌ای از دانشجویان
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ایجاد نظرسنجی‌های دوره‌ای درباره کیفیت خدمات سراها (تأسیسات و نظافت)، کیفیت غذاهای سلف، عملکرد سرپرستان و واحد تأسیسات همراه با تحلیل آماری و خروجی اکسل
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {surveys.length > 0 && (
              <button
                type="button"
                onClick={() => exportAllSurveysSummaryToExcel(surveys, responses)}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>اکسل تجمیعی نظرسنجی‌ها</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (showBuilder) {
                  resetBuilder();
                } else {
                  setEditingSurveyId(null);
                  setShowBuilder(true);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              {showBuilder ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showBuilder ? 'بستن فرم نظرسنجی' : 'ایجاد نظرسنجی دوره‌ای جدید'}</span>
            </button>
          </div>
        </div>

        {/* آمار خلاصه */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <span className="text-slate-500 text-[11px] font-bold">کل نظرسنجی‌های تعریف‌شده</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
              {surveys.length}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900">
            <span className="text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">نظرسنجی‌های فعال</span>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums">
              {activeSurveysCount}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900">
            <span className="text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">کل آراء و پاسخ‌های ثبت‌شده</span>
            <div className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-1 tabular-nums">
              {totalResponsesCount}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900">
            <span className="text-amber-700 dark:text-amber-300 text-[11px] font-bold">میانگین کل رضایت</span>
            <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1 tabular-nums">
              {(() => {
                const rated = responses.filter((r) => typeof r.overallRating === 'number');
                if (rated.length === 0) return '—';
                const avg = rated.reduce((s, r) => s + (r.overallRating || 0), 0) / rated.length;
                return `${avg.toFixed(2)} از ۵`;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* فرم ایجاد یا ویرایش نظرسنجی دوره‌ای */}
      {showBuilder && (
        <form
          onSubmit={handleSaveSurvey}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-teal-500/40 dark:border-teal-700/50 shadow-lg space-y-5 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <span>{editingSurveyId ? 'ویرایش نظرسنجی دوره‌ای' : 'طراحی و انتشار نظرسنجی دوره‌ای جدید'}</span>
            </h4>
            <button type="button" onClick={resetBuilder} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* انتخاب سریع موضوع / قالب آماده */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              ۱. انتخاب موضوع نظرسنجی (با بارگذاری خودکار سوالات استاندارد همان بخش):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(Object.keys(SURVEY_CATEGORY_LABELS) as SurveyCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => applyPresetCategory(cat, !editingSurveyId)}
                  className={`p-3 rounded-2xl border text-right text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
                    category === cat
                      ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 shrink-0">
                    {getCategoryIcon(cat)}
                  </span>
                  <span className="leading-snug">{SURVEY_CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
            </div>
            {editingSurveyId && (
              <button
                type="button"
                onClick={() => setQuestions(buildTemplateQuestions(category))}
                className="mt-2 text-[11px] font-bold text-teal-600 hover:underline cursor-pointer"
              >
                بازنشانی سوالات به قالب پیش‌فرض «{SURVEY_CATEGORY_LABELS[category]}»
              </button>
            )}
          </div>

          {/* مشخصات دوره و مخاطبان */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان نظرسنجی *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                تناوب / نوع دوره
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as SurveyFrequency)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                {(Object.keys(SURVEY_FREQUENCY_LABELS) as SurveyFrequency[]).map((f) => (
                  <option key={f} value={f}>
                    {SURVEY_FREQUENCY_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                برچسب دوره (مثلاً آذر ۱۴۰۵ / نیمسال اول)
              </label>
              <input
                type="text"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ شروع
              </label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ پایان
              </label>
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                سرای هدف (جامعه آماری)
              </label>
              <select
                value={targetDormId}
                onChange={(e) => setTargetDormId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="all">تمامی سراهای دانشجویی</option>
                {dorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {(category === 'supervisors' || category === 'comprehensive') && (
              <div>
                <label className="block font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  سرپرست مورد ارزیابی
                </label>
                <select
                  value={targetSupervisorId}
                  onChange={(e) => setTargetSupervisorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-slate-800 font-bold"
                >
                  <option value="all">همه سرپرستان (دانشجو سرپرست سرا را انتخاب کند)</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(category === 'maintenance' || category === 'dorm_services' || category === 'comprehensive') && (
              <div>
                <label className="block font-bold text-amber-700 dark:text-amber-300 mb-1">
                  واحد / کارشناس تأسیسات مورد ارزیابی
                </label>
                <select
                  value={targetMaintenanceId}
                  onChange={(e) => setTargetMaintenanceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-slate-800 font-bold"
                >
                  <option value="all">کل واحد تأسیسات (با امکان انتخاب کارشناس توسط دانشجو)</option>
                  {maintenanceStaff.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.specialty})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                وضعیت انتشار
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PeriodicSurvey['status'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="active">فعال (قابل پاسخ‌دهی برای دانشجویان)</option>
                <option value="draft">پیش‌نویس (فعلاً مخفی)</option>
                <option value="closed">بسته شده</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center text-xs">
            <div className="lg:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                توضیحات راهنما برای دانشجویان (اختیاری)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer lg:mt-5">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 cursor-pointer"
              />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                  ثبت نتایج به‌صورت ناشناس
                </span>
                <span className="text-[10px] text-slate-500">
                  نام و کد دانشجویی در جدول نتایج و اکسل مخفی می‌ماند (جلوگیری از رأی تکراری برقرار است)
                </span>
              </div>
            </label>
          </div>

          {/* ویرایشگر سوالات نظرسنجی */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                سوالات نظرسنجی ({questions.length} مورد)
              </h5>
              <span className="text-[10px] text-slate-400">
                می‌توانید متن سوالات آماده را ویرایش کنید یا سوال جدید بیفزایید.
              </span>
            </div>

            <div className="space-y-2.5">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col gap-2 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-extrabold text-[10px]">
                      سوال {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((item) => (item.id === q.id ? { ...item, text: e.target.value } : item))
                        )
                      }
                      className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    />
                    <select
                      value={q.type}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((item) =>
                            item.id === q.id
                              ? {
                                  ...item,
                                  type: e.target.value as SurveyQuestionType,
                                  options:
                                    e.target.value === 'choice' && (!item.options || item.options.length < 2)
                                      ? ['خوب', 'متوسط', 'نیازمند بهبود']
                                      : item.options,
                                }
                              : item
                          )
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold"
                    >
                      <option value="rating_5">امتیازی (۱ تا ۵ ستاره)</option>
                      <option value="choice">چندگزینه‌ای</option>
                      <option value="text">متنی / تشریحی</option>
                    </select>

                    <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required !== false}
                        onChange={(e) =>
                          setQuestions((prev) =>
                            prev.map((item) =>
                              item.id === q.id ? { ...item, required: e.target.checked } : item
                            )
                          )
                        }
                      />
                      <span>اجباری</span>
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="انتقال به بالا"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, 1)}
                        disabled={idx === questions.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="انتقال به پایین"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestions((prev) => prev.filter((item) => item.id !== q.id))}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="حذف سوال"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {q.type === 'choice' && (
                    <div className="flex items-center gap-2 pr-14">
                      <span className="text-[11px] text-slate-500 shrink-0">گزینه‌ها (جداشده با ویرگول):</span>
                      <input
                        type="text"
                        value={(q.options || []).join('، ')}
                        onChange={(e) => {
                          const opts = e.target.value
                            .split(/[،,]+/)
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setQuestions((prev) =>
                            prev.map((item) => (item.id === q.id ? { ...item, options: opts } : item))
                          );
                        }}
                        className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* افزودن سوال دلخواه */}
            <div className="p-3 rounded-2xl border border-dashed border-teal-300 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20 space-y-2 text-xs">
              <div className="font-bold text-teal-800 dark:text-teal-300">افزودن سوال جدید به این نظرسنجی:</div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="متن سوال جدید را بنویسید..."
                  className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <select
                  value={newQuestionType}
                  onChange={(e) => setNewQuestionType(e.target.value as SurveyQuestionType)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="rating_5">امتیاز ۱ تا ۵</option>
                  <option value="choice">چندگزینه‌ای</option>
                  <option value="text">تشریحی / متنی</option>
                </select>
                <label className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newQuestionRequired}
                    onChange={(e) => setNewQuestionRequired(e.target.checked)}
                  />
                  <span>اجباری</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddCustomQuestion}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن سوال</span>
                </button>
              </div>
              {newQuestionType === 'choice' && (
                <input
                  type="text"
                  value={newQuestionOptionsRaw}
                  onChange={(e) => setNewQuestionOptionsRaw(e.target.value)}
                  placeholder="گزینه‌ها را با ویرگول «،» از هم جدا کنید (مثلاً: عالی، خوب، متوسط، ضعیف)"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetBuilder}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingSurveyId ? 'ذخیره تغییرات نظرسنجی' : 'ثبت و انتشار نظرسنجی دوره‌ای'}</span>
            </button>
          </div>
        </form>
      )}

      {/* فیلتر و فهرست نظرسنجی‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              فهرست نظرسنجی‌های دوره‌ای ({filteredSurveys.length})
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              >
                <option value="all">همه موضوعات</option>
                {(Object.keys(SURVEY_CATEGORY_LABELS) as SurveyCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {SURVEY_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="closed">بسته</option>
                <option value="draft">پیش‌نویس</option>
              </select>
            </div>
          </div>

          {filteredSurveys.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              هیچ نظرسنجی مطابق فیلتر وجود ندارد. با دکمه «ایجاد نظرسنجی دوره‌ای جدید» اولین نظرسنجی را تعریف کنید.
            </div>
          ) : (
            <div className="space-y-3 max-h-[650px] overflow-y-auto pl-1">
              {filteredSurveys.map((srv) => {
                const srvResps = responses.filter((r) => r.surveyId === srv.id);
                const rated = srvResps.filter((r) => typeof r.overallRating === 'number');
                const avg =
                  rated.length > 0
                    ? rated.reduce((sum, r) => sum + (r.overallRating || 0), 0) / rated.length
                    : null;
                const isSelected = selectedSurvey?.id === srv.id;

                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedAnalyticsSurveyId(srv.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 text-xs ${
                      isSelected
                        ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-500 ring-2 ring-teal-500/20'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {srv.surveyCode}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                              srv.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : srv.status === 'closed'
                                ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {srv.status === 'active' ? 'فعال' : srv.status === 'closed' ? 'بسته' : 'پیش‌نویس'}
                          </span>
                          {srv.isAnonymous && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold flex items-center gap-0.5">
                              <EyeOff className="w-3 h-3" /> ناشناس
                            </span>
                          )}
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                          {srv.title}
                        </h5>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                        {getCategoryIcon(srv.category)}
                        {SURVEY_CATEGORY_LABELS[srv.category]}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {SURVEY_FREQUENCY_LABELS[srv.frequency]} ({srv.periodLabel})
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          مشارکت: <strong className="text-teal-700 dark:text-teal-300">{srvResps.length} نفر</strong>
                        </span>
                        {avg !== null && (
                          <span className="inline-flex items-center gap-1 font-extrabold text-amber-600 dark:text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            {avg.toFixed(2)} / ۵
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => exportSurveyResultsToExcel(srv, srvResps)}
                          className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 transition cursor-pointer"
                          title="خروجی اکسل نتایج این نظرسنجی"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus = srv.status === 'active' ? 'closed' : 'active';
                            const res = Storage.toggleSurveyStatus(srv.id, nextStatus);
                            showToast('success', res.message);
                            reloadLocal();
                          }}
                          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                          title={srv.status === 'active' ? 'بستن نظرسنجی' : 'فعال‌سازی مجدد نظرسنجی'}
                        >
                          {srv.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditSurvey(srv)}
                          className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-950 dark:text-amber-300 transition cursor-pointer"
                          title="ویرایش نظرسنجی"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetSurvey(srv)}
                          className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 transition cursor-pointer"
                          title="حذف نظرسنجی"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* پنل تحلیل آماری نتایج و خروجی اکسل */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          {!selectedSurvey ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <BarChart3 className="w-10 h-10 mx-auto text-slate-300" />
              <p>یک نظرسنجی را از فهرست سمت راست انتخاب کنید یا نظرسنجی جدیدی ایجاد نمایید.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-teal-600 font-bold">
                    <BarChart3 className="w-4 h-4" />
                    <span>تحلیل آماری نتایج • {selectedSurvey.surveyCode}</span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
                    {selectedSurvey.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    دوره: {SURVEY_FREQUENCY_LABELS[selectedSurvey.frequency]} ({selectedSurvey.periodLabel}) • بازه: {selectedSurvey.startDate} تا {selectedSurvey.endDate}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => exportSurveyResultsToExcel(selectedSurvey, selectedResponses)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>خروجی اکسل کامل نتایج (.xlsx)</span>
                </button>
              </div>

              {selectedResponses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  هنوز هیچ دانشجویی در این نظرسنجی شرکت نکرده است. با فعال بودن وضعیت، دانشجویان می‌توانند از کارتابل خود در این نظرسنجی مشارکت کنند.
                </div>
              ) : (
                <div className="space-y-5">
                  {/* خلاصه عملکرد به تفکیک سرا / سرپرست / تأسیسات */}
                  {(() => {
                    const dormMap = new Map<string, number[]>();
                    const supMap = new Map<string, number[]>();
                    const maintMap = new Map<string, number[]>();
                    selectedResponses.forEach((r) => {
                      if (typeof r.overallRating !== 'number') return;
                      const dName = r.dormName || 'نامشخص';
                      dormMap.set(dName, [...(dormMap.get(dName) || []), r.overallRating]);
                      if (r.targetSupervisorName) {
                        supMap.set(r.targetSupervisorName, [...(supMap.get(r.targetSupervisorName) || []), r.overallRating]);
                      }
                      if (r.targetMaintenanceName) {
                        maintMap.set(r.targetMaintenanceName, [...(maintMap.get(r.targetMaintenanceName) || []), r.overallRating]);
                      }
                    });
                    if (dormMap.size === 0 && supMap.size === 0 && maintMap.size === 0) return null;
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {dormMap.size > 0 && (
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                            <div className="font-extrabold text-slate-800 dark:text-slate-100">
                              امتیاز رضایت به تفکیک سرا:
                            </div>
                            {Array.from(dormMap.entries()).map(([name, vals]) => {
                              const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                              return (
                                <div key={name} className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{name} ({vals.length} رأی)</span>
                                  <span className="font-extrabold text-teal-700 dark:text-teal-300 tabular-nums">
                                    {avg.toFixed(2)} / ۵ ({Math.round((avg / 5) * 100)}٪)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {supMap.size > 0 && (
                          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-2">
                            <div className="font-extrabold text-indigo-900 dark:text-indigo-200">
                              میانگین ارزیابی سرپرستان:
                            </div>
                            {Array.from(supMap.entries()).map(([name, vals]) => {
                              const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                              return (
                                <div key={name} className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{name} ({vals.length} رأی)</span>
                                  <span className="font-extrabold text-indigo-700 dark:text-indigo-300 tabular-nums">
                                    {avg.toFixed(2)} / ۵ ({Math.round((avg / 5) * 100)}٪)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {maintMap.size > 0 && (
                          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2">
                            <div className="font-extrabold text-amber-900 dark:text-amber-200">
                              میانگین ارزیابی واحد / پرسنل تأسیسات:
                            </div>
                            {Array.from(maintMap.entries()).map(([name, vals]) => {
                              const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                              return (
                                <div key={name} className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{name} ({vals.length} رأی)</span>
                                  <span className="font-extrabold text-amber-700 dark:text-amber-300 tabular-nums">
                                    {avg.toFixed(2)} / ۵ ({Math.round((avg / 5) * 100)}٪)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* تحلیل تک‌تک سوالات */}
                  <div className="space-y-3">
                    {selectedSurvey.questions.map((q, qIdx) => {
                      const qAnswers = selectedResponses
                        .map((r) => r.answers.find((a) => a.questionId === q.id))
                        .filter((a): a is NonNullable<typeof a> => Boolean(a));

                      if (q.type === 'rating_5') {
                        const nums = qAnswers
                          .map((a) => a.ratingValue)
                          .filter((v): v is number => typeof v === 'number' && v > 0);
                        const avg = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
                        const pct = Math.round((avg / 5) * 100);
                        return (
                          <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {qIdx + 1}. {q.text}
                              </span>
                              <span className="font-black text-teal-700 dark:text-teal-300 shrink-0 tabular-nums">
                                {nums.length > 0 ? `${avg.toFixed(2)} / ۵ (${pct}٪)` : 'بدون پاسخ'}
                              </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pt-1">
                              {[5, 4, 3, 2, 1].map((star) => (
                                <span key={star} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                  {star} ستاره: {nums.filter((v) => v === star).length}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (q.type === 'choice') {
                        const counts = new Map<string, number>();
                        (q.options || []).forEach((opt) => counts.set(opt, 0));
                        qAnswers.forEach((a) => {
                          if (a.selectedOption) {
                            counts.set(a.selectedOption, (counts.get(a.selectedOption) || 0) + 1);
                          }
                        });
                        const totalChoices = qAnswers.filter((a) => a.selectedOption).length || 1;
                        return (
                          <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                            <div className="font-bold text-slate-800 dark:text-slate-100">
                              {qIdx + 1}. {q.text}
                            </div>
                            <div className="space-y-1.5">
                              {Array.from(counts.entries()).map(([opt, cnt]) => {
                                const pct = Math.round((cnt / totalChoices) * 100);
                                return (
                                  <div key={opt} className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                      <span>{opt}</span>
                                      <span className="font-bold tabular-nums">{cnt} نفر ({pct}٪)</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      const textReplies = qAnswers
                        .map((a) => (a.textValue || '').trim())
                        .filter(Boolean);
                      return (
                        <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {qIdx + 1}. {q.text} ({textReplies.length} دیدگاه)
                          </div>
                          {textReplies.length === 0 ? (
                            <p className="text-[11px] text-slate-400">دیدگاه متنی ثبت نشده است.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {textReplies.map((txt, tIdx) => (
                                <div key={tIdx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 text-[11px] leading-relaxed">
                                  {txt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* دیالوگ تایید حذف نظرسنجی */}
      {deleteTargetSurvey && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">حذف نظرسنجی دوره‌ای</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از حذف نظرسنجی «{deleteTargetSurvey.title}» و کلیه پاسخ‌های ثبت‌شده آن اطمینان دارید؟ این عملیات قابل بازگشت نیست.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetSurvey(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = Storage.deleteSurvey(deleteTargetSurvey.id);
                  setDeleteTargetSurvey(null);
                  showToast('success', res.message);
                  reloadLocal();
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                تایید و حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
