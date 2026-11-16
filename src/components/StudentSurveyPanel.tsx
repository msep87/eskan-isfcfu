import React, { useMemo, useState } from 'react';
import {
  MaintenanceStaff,
  PeriodicSurvey,
  Student,
  Supervisor,
  SurveyAnswer,
  SurveyResponse,
} from '../types';
import { Storage } from '../utils/storage';
import { SURVEY_CATEGORY_LABELS, SURVEY_FREQUENCY_LABELS } from '../utils/excelUtils';
import {
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  EyeOff,
  Send,
  Star,
  UserCheck,
  Utensils,
  Wrench,
  Sparkles,
} from 'lucide-react';

interface StudentSurveyPanelProps {
  student: Student;
  onSubmitted: () => void;
}

const RATING_LABELS = ['بسیار ضعیف', 'ضعیف', 'متوسط', 'خوب', 'عالی'];

export const StudentSurveyPanel: React.FC<StudentSurveyPanelProps> = ({
  student,
  onSubmitted,
}) => {
  const [surveys, setSurveys] = useState<PeriodicSurvey[]>(() => Storage.getSurveys());
  const [allResponses, setAllResponses] = useState<SurveyResponse[]>(() =>
    Storage.getSurveyResponses()
  );
  const supervisors: Supervisor[] = useMemo(() => Storage.getSupervisors(), []);
  const maintenanceList: MaintenanceStaff[] = useMemo(
    () => Storage.getMaintenanceStaff().filter((m) => m.status === 'active' || m.isActive !== false),
    []
  );

  // پاسخ‌های در حال پر شدن به تفکیک شناسه نظرسنجی
  const [draftAnswers, setDraftAnswers] = useState<
    Record<string, Record<string, { rating?: number; option?: string; text?: string }>>
  >({});
  const [draftComments, setDraftComments] = useState<Record<string, string>>({});
  const [selectedSupervisors, setSelectedSupervisors] = useState<Record<string, string>>({});
  const [selectedMaintenance, setSelectedMaintenance] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const visibleSurveys = useMemo(() => {
    return surveys.filter((s) => {
      if (s.status !== 'active') return false;
      if (s.targetDormId && s.targetDormId !== 'all' && student.assignedDormId !== s.targetDormId) {
        return false;
      }
      return true;
    });
  }, [surveys, student.assignedDormId]);

  // پیش‌انتخاب سرپرست سرای دانشجو در نظرسنجی سرپرستان
  const defaultDormSupervisorId = useMemo(() => {
    if (!student.assignedDormId) return supervisors[0]?.id || '';
    const match = supervisors.find(
      (sup) =>
        sup.assignedDormIds?.includes(student.assignedDormId!) ||
        sup.assignedDormId === student.assignedDormId ||
        sup.assignedDormId === 'all'
    );
    return match?.id || supervisors[0]?.id || '';
  }, [supervisors, student.assignedDormId]);

  const setAnswerField = (
    surveyId: string,
    questionId: string,
    patch: { rating?: number; option?: string; text?: string }
  ) => {
    setDraftAnswers((prev) => ({
      ...prev,
      [surveyId]: {
        ...(prev[surveyId] || {}),
        [questionId]: {
          ...(prev[surveyId]?.[questionId] || {}),
          ...patch,
        },
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent, survey: PeriodicSurvey) => {
    e.preventDefault();
    const srvDraft = draftAnswers[survey.id] || {};

    for (const q of survey.questions) {
      if (q.required === false) continue;
      const val = srvDraft[q.id];
      if (q.type === 'rating_5' && (!val?.rating || val.rating < 1)) {
        setFeedback({ type: 'error', text: `لطفاً به سوال «${q.text}» امتیاز دهید.` });
        return;
      }
      if (q.type === 'choice' && !val?.option) {
        setFeedback({ type: 'error', text: `لطفاً یک گزینه برای سوال «${q.text}» انتخاب کنید.` });
        return;
      }
      if (q.type === 'text' && !(val?.text || '').trim()) {
        setFeedback({ type: 'error', text: `لطفاً پاسخ سوال «${q.text}» را وارد نمایید.` });
        return;
      }
    }

    let supId: string | undefined = survey.targetSupervisorId;
    let supName: string | undefined = survey.targetSupervisorName;
    if (
      (survey.category === 'supervisors' || survey.category === 'comprehensive') &&
      (!survey.targetSupervisorId || survey.targetSupervisorId === 'all')
    ) {
      const pickedSupId = selectedSupervisors[survey.id] || defaultDormSupervisorId;
      const sup = supervisors.find((s) => s.id === pickedSupId);
      if (sup) {
        supId = sup.id;
        supName = sup.fullName;
      }
    }

    let maintId: string | undefined = survey.targetMaintenanceId;
    let maintName: string | undefined = survey.targetMaintenanceName;
    if (
      (survey.category === 'maintenance' || survey.category === 'dorm_services' || survey.category === 'comprehensive') &&
      (!survey.targetMaintenanceId || survey.targetMaintenanceId === 'all')
    ) {
      const pickedMaintId = selectedMaintenance[survey.id] || 'all';
      if (pickedMaintId !== 'all') {
        const m = maintenanceList.find((item) => item.id === pickedMaintId);
        if (m) {
          maintId = m.id;
          maintName = `${m.fullName} (${m.specialty})`;
        }
      } else {
        maintId = 'all';
        maintName = 'کل واحد تأسیسات';
      }
    }

    const answers: SurveyAnswer[] = survey.questions.map((q) => {
      const val = srvDraft[q.id] || {};
      return {
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        ratingValue: q.type === 'rating_5' ? val.rating : undefined,
        selectedOption: q.type === 'choice' ? val.option : undefined,
        textValue: q.type === 'text' ? (val.text || '').trim() : undefined,
      };
    });

    const res = Storage.submitSurveyResponse({
      survey,
      student,
      answers,
      overallComment: draftComments[survey.id],
      targetSupervisorId: supId,
      targetSupervisorName: supName,
      targetMaintenanceId: maintId,
      targetMaintenanceName: maintName,
    });

    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    setSurveys(Storage.getSurveys());
    setAllResponses(Storage.getSurveyResponses());
    onSubmitted();
  };

  const getCategoryIcon = (cat: PeriodicSurvey['category']) => {
    if (cat === 'cafeteria') return <Utensils className="w-5 h-5 text-orange-600" />;
    if (cat === 'supervisors') return <UserCheck className="w-5 h-5 text-indigo-600" />;
    if (cat === 'maintenance') return <Wrench className="w-5 h-5 text-amber-600" />;
    if (cat === 'cleanliness') return <Sparkles className="w-5 h-5 text-emerald-600" />;
    if (cat === 'dorm_services') return <Building2 className="w-5 h-5 text-teal-600" />;
    return <ClipboardList className="w-5 h-5 text-purple-600" />;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-300">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              نظرسنجی‌های دوره‌ای کیفیت خدمات سراها، سلف و مسئولان
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              دیدگاه‌های شما مستقیماً برای بهبود خدمات تأسیسات، نظافت، کیفیت غذای سلف و ارزیابی عملکرد به مدیریت سامانه منعکس می‌شود.
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {visibleSurveys.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400 space-y-2">
          <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
          <p>در حال حاضر نظرسنجی فعال جدیدی برای شرکت شما منتشر نشده است.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {visibleSurveys.map((srv) => {
            const myResp = allResponses.find(
              (r) => r.surveyId === srv.id && r.studentId === student.studentId
            );
            const srvDraft = draftAnswers[srv.id] || {};
            const needsSupervisorPick =
              (srv.category === 'supervisors' || srv.category === 'comprehensive') &&
              (!srv.targetSupervisorId || srv.targetSupervisorId === 'all') &&
              supervisors.length > 0;
            const needsMaintPick =
              (srv.category === 'maintenance' || srv.category === 'dorm_services' || srv.category === 'comprehensive') &&
              (!srv.targetMaintenanceId || srv.targetMaintenanceId === 'all') &&
              maintenanceList.length > 0;

            return (
              <div
                key={srv.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getCategoryIcon(srv.category)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                          {srv.surveyCode}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                          {SURVEY_CATEGORY_LABELS[srv.category]}
                        </span>
                        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {SURVEY_FREQUENCY_LABELS[srv.frequency]} • {srv.periodLabel}
                        </span>
                        {srv.isAnonymous && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 font-bold inline-flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> پاسخ‌دهی ناشناس
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {srv.title}
                      </h4>
                      {srv.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {srv.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {myResp ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>پاسخ شما ثبت شده است</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-extrabold shrink-0">
                      در انتظار مشارکت شما (مهلت: {srv.endDate})
                    </span>
                  )}
                </div>

                {myResp ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                      <span>تاریخ ثبت پاسخ شما: {myResp.submittedAt}</span>
                      {typeof myResp.overallRating === 'number' && (
                        <span>میانگین امتیاز ثبت‌شده: {myResp.overallRating} از ۵</span>
                      )}
                    </div>
                    {myResp.overallComment && (
                      <p className="text-slate-600 dark:text-slate-300">
                        نظر شما: {myResp.overallComment}
                      </p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={(e) => handleSubmit(e, srv)} className="space-y-4">
                    {(needsSupervisorPick || needsMaintPick || srv.targetSupervisorName || srv.targetMaintenanceName) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                        {srv.targetSupervisorName && (
                          <div>
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              سرپرست مورد ارزیابی:{' '}
                            </span>
                            <strong className="text-indigo-700 dark:text-indigo-300">
                              {srv.targetSupervisorName}
                            </strong>
                          </div>
                        )}
                        {needsSupervisorPick && (
                          <div>
                            <label className="block font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                              انتخاب سرپرست مورد ارزیابی:
                            </label>
                            <select
                              value={selectedSupervisors[srv.id] || defaultDormSupervisorId}
                              onChange={(e) =>
                                setSelectedSupervisors((prev) => ({
                                  ...prev,
                                  [srv.id]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold"
                            >
                              {supervisors.map((sup) => (
                                <option key={sup.id} value={sup.id}>
                                  {sup.fullName}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {srv.targetMaintenanceName && (
                          <div>
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              کارشناس / واحد تأسیسات:{' '}
                            </span>
                            <strong className="text-amber-700 dark:text-amber-300">
                              {srv.targetMaintenanceName}
                            </strong>
                          </div>
                        )}
                        {needsMaintPick && (
                          <div>
                            <label className="block font-bold text-amber-700 dark:text-amber-300 mb-1">
                              بخش / کارشناس تأسیسات (اختیاری):
                            </label>
                            <select
                              value={selectedMaintenance[srv.id] || 'all'}
                              onChange={(e) =>
                                setSelectedMaintenance((prev) => ({
                                  ...prev,
                                  [srv.id]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-bold"
                            >
                              <option value="all">کل واحد تأسیسات سرا</option>
                              {maintenanceList.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.fullName} ({m.specialty})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      {srv.questions.map((q, qIdx) => {
                        const ans = srvDraft[q.id] || {};
                        return (
                          <div
                            key={q.id}
                            className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-2.5 text-xs"
                          >
                            <div className="font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                              {qIdx + 1}. {q.text}
                              {q.required !== false && <span className="text-rose-500 mr-1">*</span>}
                            </div>

                            {q.type === 'rating_5' && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {[1, 2, 3, 4, 5].map((score) => {
                                  const selected = ans.rating === score;
                                  return (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() =>
                                        setAnswerField(srv.id, q.id, { rating: score })
                                      }
                                      className={`px-3 py-2 rounded-xl border font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        selected
                                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                                      }`}
                                    >
                                      <Star
                                        className={`w-3.5 h-3.5 ${
                                          selected ? 'fill-white text-white' : 'text-amber-400'
                                        }`}
                                      />
                                      <span>
                                        {score} ({RATING_LABELS[score - 1]})
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {q.type === 'choice' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {(q.options || []).map((opt) => {
                                  const selected = ans.option === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() =>
                                        setAnswerField(srv.id, q.id, { option: opt })
                                      }
                                      className={`px-3.5 py-2.5 rounded-xl border text-right font-bold transition cursor-pointer ${
                                        selected
                                          ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {q.type === 'text' && (
                              <textarea
                                rows={2}
                                value={ans.text || ''}
                                onChange={(e) =>
                                  setAnswerField(srv.id, q.id, { text: e.target.value })
                                }
                                placeholder="دیدگاه یا پیشنهاد خود را بنویسید..."
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        توضیحات تکمیلی یا پیشنهاد کلی (اختیاری):
                      </label>
                      <input
                        type="text"
                        value={draftComments[srv.id] || ''}
                        onChange={(e) =>
                          setDraftComments((prev) => ({ ...prev, [srv.id]: e.target.value }))
                        }
                        placeholder="هر نکته اضافی که به بهبود خدمات کمک می‌کند..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>ثبت و ارسال پاسخ نظرسنجی</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
