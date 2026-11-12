import React, { useState } from 'react';
import {
  CounselorStaff,
  CounselorShiftSchedule,
  CounselorShiftReport,
  Message,
  Dormitory,
} from '../types';
import { Storage } from '../utils/storage';
import {
  exportCounselorShiftScheduleToExcel,
  exportCounselorReportsToExcel,
} from '../utils/excelUtils';
import {
  HeartHandshake,
  Calendar,
  Clock,
  User,
  Users,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Printer,
  Plus,
  BookOpen,
  MessageSquare,
  Sparkles,
  Phone,
  Building2,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface CounselorDashboardProps {
  counselor: CounselorStaff;
  dorms: Dormitory[];
  shifts: CounselorShiftSchedule[];
  reports: CounselorShiftReport[];
  messages: Message[];
  onRefreshData: () => void;
  onOpenMessages?: () => void;
  onOpenUserGuide?: (role: 'counselor') => void;
}

const DAY_LABELS: Record<string, string> = {
  saturday: 'شنبه',
  sunday: 'یکشنبه',
  monday: 'دوشنبه',
  tuesday: 'سه‌شنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنج‌شنبه',
  friday: 'جمعه',
  all: 'همه‌روزه',
};

const COMMON_CASE_TAGS = [
  'اضطراب و استرس تحصیلی',
  'سازگاری و دوری از خانواده (غربت)',
  'تعارضات هم‌اتاقی و روابط بین‌فردی',
  'افت انگیزه و فرسودگی',
  'افسردگی و نوسانات خلقی',
  'اختلال خواب و تغذیه در سرا',
  'مسائل خانوادگی و فردی',
  'بحران‌های حاد و ارجاع پزشکی',
];

export const CounselorDashboard: React.FC<CounselorDashboardProps> = ({
  counselor,
  dorms,
  shifts,
  reports,
  messages,
  onRefreshData,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'shifts' | 'new_report' | 'reports_history'>('requests');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // فیلتر درخواست‌های مشاوره
  const [requestFilterStatus, setRequestFilterStatus] = useState<string>('all');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');

  // پاسخ‌دهی به درخواست مشاوره دانشجو
  const [answeringMsg, setAnsweringMsg] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [suggestedSessionTime, setSuggestedSessionTime] = useState('');
  const [sessionLocation, setSessionLocation] = useState('دفتر مشاوره و روانشناسی سرا');

  // فرم ثبت گزارش شیفت مشاور
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString('fa-IR'));
  const [reportTimeWindow, setReportTimeWindow] = useState('۱۴:۰۰ الی ۱۸:۰۰');
  const [reportDormId, setReportDormId] = useState(dorms[0]?.id || 'all');
  const [totalSessions, setTotalSessions] = useState(3);
  const [urgentCases, setUrgentCases] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'اضطراب و استرس تحصیلی',
    'تعارضات هم‌اتاقی و روابط بین‌فردی',
  ]);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [interventionsSummary, setInterventionsSummary] = useState('');
  const [urgentReferralDetails, setUrgentReferralDetails] = useState('');
  const [recommendationsToAdmin, setRecommendationsToAdmin] = useState('');

  // فیلتر گزارش‌های پیشین
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // شیفت‌های اختصاص‌یافته به این مشاور
  const myShifts = shifts.filter((s) => s.counselorId === counselor.id);
  // گزارش‌های ثبت‌شده این مشاور
  const myReports = reports.filter((r) => r.counselorId === counselor.id);

  // تیکت‌ها و درخواست‌های مشاوره دانشجوها (دسته‌بندی مشاوره یا گیرنده مشاور)
  const counselingMessages = messages.filter(
    (m) =>
      m.category === 'counseling' ||
      m.receiverType === 'counselor' ||
      m.subject.includes('مشاوره') ||
      m.subject.includes('روانشناس')
  );

  const filteredMessages = counselingMessages.filter((msg) => {
    if (requestFilterStatus === 'pending' && (msg.replies && msg.replies.length > 0)) return false;
    if (requestFilterStatus === 'replied' && (!msg.replies || msg.replies.length === 0)) return false;
    if (requestSearchQuery.trim()) {
      const q = requestSearchQuery.toLowerCase();
      const matchSub = msg.subject.toLowerCase().includes(q);
      const matchBody = msg.content.toLowerCase().includes(q);
      const matchSender = msg.senderName.toLowerCase().includes(q);
      if (!matchSub && !matchBody && !matchSender) return false;
    }
    return true;
  });

  // ارسال پاسخ و هماهنگی جلسه با دانشجو
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringMsg || !replyText.trim()) return;

    let fullBody = replyText.trim();
    if (suggestedSessionTime.trim()) {
      fullBody += `\n\n🗓 زمان پیشنهادی جلسه حضوری: ${suggestedSessionTime.trim()} | محل: ${sessionLocation}`;
    }

    const res = Storage.replyToMessage(answeringMsg.id, {
      senderName: `${counselor.fullName} (مشاور مرکز)`,
      senderRole: 'counselor',
      content: fullBody,
      date: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    });

    if (res.success) {
      showFeedback('پاسخ مشاوره و نوبت جلسه با موفقیت برای دانشجو ارسال گردید.');
      setAnsweringMsg(null);
      setReplyText('');
      setSuggestedSessionTime('');
      onRefreshData();
    } else {
      showFeedback('خطا در ارسال پاسخ', 'error');
    }
  };

  // اضافه/حذف تگ موضوعات مشاوره در فرم گزارش
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategoryInput.trim() && !selectedCategories.includes(customCategoryInput.trim())) {
      setSelectedCategories([...selectedCategories, customCategoryInput.trim()]);
      setCustomCategoryInput('');
    }
  };

  // ثبت گزارش شیفت مشاور
  const handleSaveShiftReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionsSummary.trim()) {
      alert('لطفاً شرح اقدامات و مشاوره‌های ارائه‌شده را تکمیل فرمایید.');
      return;
    }

    const selectedDorm = dorms.find((d) => d.id === reportDormId);
    const res = Storage.addCounselorReport({
      counselorId: counselor.id,
      counselorName: counselor.fullName,
      shiftDate: reportDate.trim() || new Date().toLocaleDateString('fa-IR'),
      shiftTimeWindow: reportTimeWindow.trim(),
      dormId: reportDormId,
      dormName: selectedDorm?.name || 'مرکز مشاوره و سلامت روان',
      totalSessionsCount: Number(totalSessions) || 0,
      urgentCasesCount: Number(urgentCases) || 0,
      caseCategories: selectedCategories,
      interventionsSummary: interventionsSummary.trim(),
      urgentReferralDetails: urgentReferralDetails.trim() || undefined,
      recommendationsToAdmin: recommendationsToAdmin.trim() || undefined,
    });

    if (res.success && res.report) {
      showFeedback(`گزارش فعالیت شیفت مشاور با کد [${res.report.reportCode}] با موفقیت ثبت گردید.`);
      setInterventionsSummary('');
      setUrgentReferralDetails('');
      setRecommendationsToAdmin('');
      setActiveTab('reports_history');
      onRefreshData();
    } else {
      showFeedback('خطا در ذخیره گزارش شیفت', 'error');
    }
  };

  // چاپ گزارش شیفت
  const handlePrintReport = (report: CounselorShiftReport) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="fa">
      <head>
        <title>گزارش شیفت مشاوره - ${report.reportCode}</title>
        <style>
          body { font-family: system-ui, Tahoma, sans-serif; padding: 24px; direction: rtl; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
          .field { margin-bottom: 10px; font-size: 13px; line-height: 1.6; }
          .title { font-weight: bold; color: #1e293b; }
          .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-top: 12px; background: #f8fafc; font-size: 13px; }
          .footer { margin-top: 40px; text-align: left; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>دانشگاه فرهنگیان - اداره بهداشت و مشاوره روانشناختی</h2>
          <h3>برگ گزارش رسمی شیفت و فعالیت‌های مشاوره سراها</h3>
          <p>کد پیگیری گزارش: <strong>${report.reportCode}</strong> | تاریخ ثبت: ${report.createdAt}</p>
        </div>
        <div class="field"><span class="title">نام و عنوان مشاور:</span> ${report.counselorName}</div>
        <div class="field"><span class="title">مرکز / سرای دانشجویی:</span> ${report.dormName || 'مرکز مشاوره مرکزی'}</div>
        <div class="field"><span class="title">تاریخ و ساعت شیفت:</span> ${report.shiftDate} (${report.shiftTimeWindow || '-'})</div>
        <div class="field"><span class="title">تعداد مراجعین دانشجو:</span> ${report.totalSessionsCount} نفر</div>
        <div class="field"><span class="title">موارد اضطراری / مداخله فوری:</span> ${report.urgentCasesCount || 0} مورد</div>
        <div class="field"><span class="title">حوزه‌های مشاوره:</span> ${(report.caseCategories || []).join('، ')}</div>
        
        <div class="box">
          <div class="title">شرح اقدامات و مشاوره‌های ارائه‌شده:</div>
          <p>${report.interventionsSummary}</p>
        </div>

        ${
          report.urgentReferralDetails
            ? `<div class="box" style="border-color: #fca5a5; background: #fff5f5;">
                <div class="title" style="color: #b91c1c;">ارجاعات فوری و پیگیری‌های بحران:</div>
                <p>${report.urgentReferralDetails}</p>
              </div>`
            : ''
        }

        ${
          report.recommendationsToAdmin
            ? `<div class="box">
                <div class="title">پیشنهادات و توصیه‌ها به اداره سراها و مسئولین:</div>
                <p>${report.recommendationsToAdmin}</p>
              </div>`
            : ''
        }

        <div class="footer">
          <p>امضای دیجیتال مشاور مرکز: <strong>${report.counselorName}</strong></p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* پیام بازخورد */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* بنر سربرگ کارتابل مشاور */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <HeartHandshake className="w-8 h-8 text-teal-200" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">{counselor.fullName}</h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-400 text-slate-950 font-extrabold">
                  {counselor.specialty || 'متخصص روانشناسی و مشاوره'}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 font-bold border border-emerald-400/30">
                  مرکز مشاوره و سلامت روان سراها
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-1.5 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-teal-300" />
                  <span dir="ltr">{counselor.phone}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-teal-300" />
                  <span>دفتر مستقر: {counselor.officeLocation || 'دفتر مشاوره پردیس'}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('new_report')}
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-teal-50 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>+ ثبت گزارش فعالیت شیفت</span>
            </button>

            {onOpenUserGuide && (
              <button
                onClick={() => onOpenUserGuide('counselor')}
                className="px-4 py-2.5 bg-teal-600/40 hover:bg-teal-600/60 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-teal-400/30 cursor-pointer"
                title="مشاهده راهنمای جامع مشاور و دانلود PDF"
              >
                <BookOpen className="w-4 h-4 text-teal-200" />
                <span>راهنمای کاربری (PDF)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">تیکت‌ها و پیام‌های مراجعین</div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{counselingMessages.length}</div>
          <div className="text-[10px] text-teal-600 font-bold mt-0.5">درخواست‌های مشاوره دانشجوها</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/20 shadow-xs">
          <div className="text-[11px] text-teal-700 dark:text-teal-400 font-bold">شیفت‌های کاری تعریف‌شده</div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-400 mt-1">{myShifts.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">جلسات حضور در هفته و ماه</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">گزارش‌های شیفت ثبت‌شده</div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{myReports.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">در کارنامه عملکردی سامانه</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 shadow-xs">
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">جلسات مشاوره برگزارشده</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
            {myReports.reduce((acc, r) => acc + (r.totalSessionsCount || 0), 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">جلسات فردی و مداخلات</div>
        </div>
      </div>

      {/* تب‌های اصلی */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>درخواست‌های مشاوره دانشجوها ({filteredMessages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'shifts'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>برنامه شیفت‌های کاری من ({myShifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('new_report')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'new_report'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>+ فرم ثبت گزارش شیفت</span>
        </button>

        <button
          onClick={() => setActiveTab('reports_history')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reports_history'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>دفترچه گزارش‌های ثبت‌شده ({myReports.length})</span>
        </button>
      </div>

      {/* 1. تب درخواست‌های مشاوره دانشجوها */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجو در متن پیام یا نام دانشجو..."
                value={requestSearchQuery}
                onChange={(e) => setRequestSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium shrink-0">فیلتر وضعیت:</span>
              <select
                value={requestFilterStatus}
                onChange={(e) => setRequestFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="all">همه درخواست‌ها</option>
                <option value="pending">در انتظار پاسخ و هماهنگی</option>
                <option value="replied">پاسخ‌داده‌شده / نوبت‌دهی</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredMessages.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                <HeartHandshake className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  درخواست مشاوره‌ای یافت نشد
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  پیام‌ها و درخواست‌های ارسالی دانشجوها در این کارتابل نمایش داده می‌شود.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const hasReplies = msg.replies && msg.replies.length > 0;
                return (
                  <div
                    key={msg.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[11px] font-black">
                          درخواست مشاوره
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {msg.subject}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>ارسال‌کننده: <strong>{msg.senderName}</strong></span>
                        <span>•</span>
                        <span>{msg.date}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-3 whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    {/* پاسخ‌های قبلی */}
                    {hasReplies && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>پاسخ مشاور / هماهنگی نوبت:</span>
                        </div>
                        {msg.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap"
                          >
                            <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mb-1">
                              {rep.senderName} ({rep.date})
                            </div>
                            {rep.content}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 pt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setAnsweringMsg(msg);
                          setReplyText('');
                          setSuggestedSessionTime('');
                        }}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{hasReplies ? 'ارسال پیام تکمیلی' : 'پاسخ و هماهنگی جلسه'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. تب شیفت‌های کاری مشاور */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                برنامه زمان‌بندی حضور مشاور در سراها
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                شیفت‌ها شامل روز هفته و بازه زمانی مشخص هستند و توسط مدیر سامانه تعیین شده‌اند
              </p>
            </div>
            <button
              onClick={() => exportCounselorShiftScheduleToExcel(myShifts)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>خروجی اکسل برنامه شیفت</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myShifts.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                شیفت مشخصی برای شما تعریف نشده است. جهت هماهنگی به مدیر سامانه مراجعه نمایید.
              </div>
            ) : (
              myShifts.map((sh) => (
                <div
                  key={sh.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-400 transition"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-black text-xs">
                      {DAY_LABELS[sh.dayOfWeek] || sh.dayOfWeek}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{sh.startTime} الی {sh.endTime}</span>
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sh.dormName || 'مرکز مشاوره'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>محل استقرار: {sh.roomNumber || 'دفتر مشاوره'}</span>
                    </div>
                    {sh.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl mt-2">
                        {sh.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. تب فرم ثبت گزارش شیفت مشاور */}
      {activeTab === 'new_report' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                ثبت گزارش رسمی فعالیت شیفت مشاور
              </h3>
              <p className="text-xs text-slate-500">
                ثبت جزئیات مراجعین، نوع مسائل، اقدامات مداخله‌ای و ارجاعات فوری جهت مشاهده مدیریت
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveShiftReport} className="space-y-4 max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ شیفت *
                </label>
                <input
                  type="text"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  بازه زمانی حضور در شیفت *
                </label>
                <input
                  type="text"
                  required
                  value={reportTimeWindow}
                  onChange={(e) => setReportTimeWindow(e.target.value)}
                  placeholder="مثال: ۱۴:۰۰ الی ۱۸:۰۰"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سرای دانشجویی محل استقرار
                </label>
                <select
                  value={reportDormId}
                  onChange={(e) => setReportDormId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="all">مرکز مشاوره مرکزی دانشگاه</option>
                  {dorms.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تعداد کل جلسات / مراجعین *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تعداد موارد بحرانی و ارجاع فوری
                </label>
                <input
                  type="number"
                  min="0"
                  value={urgentCases}
                  onChange={(e) => setUrgentCases(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                موضوعات و حوزه‌های مراجعین این شیفت:
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_CASE_TAGS.map((tag) => {
                  const isSelected = selectedCategories.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleCategory(tag)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="افزودن موضوع یا دسته‌بندی دلخواه..."
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  افزودن
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                شرح خلاصه اقدامات و مشاوره‌های ارائه‌شده *
              </label>
              <textarea
                rows={4}
                required
                value={interventionsSummary}
                onChange={(e) => setInterventionsSummary(e.target.value)}
                placeholder="شرح تکنیک‌های روانشناختی، راهکارهای حل مسئله و مشاوره‌های فردی ارائه‌شده..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                اقدامات اضطراری و ارجاعات فوری (در صورت وجود)
              </label>
              <textarea
                rows={2}
                value={urgentReferralDetails}
                onChange={(e) => setUrgentReferralDetails(e.target.value)}
                placeholder="ارجاع به پزشک، روانپزشک یا هماهنگی با خانواده و سرپرست سرا..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                پیشنهادات و توصیه‌ها به مدیریت سراها
              </label>
              <textarea
                rows={2}
                value={recommendationsToAdmin}
                onChange={(e) => setRecommendationsToAdmin(e.target.value)}
                placeholder="پیشنهاد برگزاری کارگاه‌های مهارتی، بهینه‌سازی امکانات خوابگاهی..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ثبت رسمی گزارش در سامانه</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. تب دفترچه گزارش‌های پیشین مشاور */}
      {activeTab === 'reports_history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                دفترچه سوابق گزارش‌های فعالیت شیفت
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                گزارش‌های ثبت‌شده توسط مشاور با قابلیت فیلتر، چاپ رسمی و خروجی اکسل
              </p>
            </div>
            <button
              onClick={() => exportCounselorReportsToExcel(myReports)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>خروجی اکسل تمام گزارش‌ها</span>
            </button>
          </div>

          <div className="space-y-3">
            {myReports.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                هنوز گزارشی برای شیفت‌های خود ثبت نکرده‌اید.
              </div>
            ) : (
              myReports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300">
                        {rep.reportCode}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        تاریخ: {rep.shiftDate} ({rep.shiftTimeWindow || '-'})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        • {rep.dormName || 'مرکز مشاوره'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        {rep.totalSessionsCount} مراجعه‌کننده
                      </span>
                      {rep.urgentCasesCount && rep.urgentCasesCount > 0 ? (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 font-bold text-rose-700 dark:text-rose-300 border border-rose-200">
                          {rep.urgentCasesCount} ارجاع فوری
                        </span>
                      ) : null}
                      <button
                        onClick={() => handlePrintReport(rep)}
                        className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                        title="چاپ رسمی این گزارش"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {rep.caseCategories && rep.caseCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {rep.caseCategories.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-2.5 whitespace-pre-wrap">
                    {rep.interventionsSummary}
                  </p>

                  {rep.urgentReferralDetails && (
                    <div className="text-xs p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
                      <strong>پیگیری‌های فوری:</strong> {rep.urgentReferralDetails}
                    </div>
                  )}

                  {rep.recommendationsToAdmin && (
                    <div className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 mt-2">
                      <strong>پیشنهادات به اداره سراها:</strong> {rep.recommendationsToAdmin}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* مدال پاسخ به تیکت و هماهنگی جلسه مشاوره */}
      {answeringMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    پاسخ به درخواست مشاوره دانشجو
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ارسال پیام مستقیم و تعیین نوبت جلسه حضوری
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAnsweringMsg(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3.5 my-4">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  دانشجو: {answeringMsg.senderName}
                </div>
                <div className="text-slate-500 mt-0.5">
                  موضوع: {answeringMsg.subject}
                </div>
                <div className="text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">
                  {answeringMsg.content}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  متن پاسخ و راهنمایی مشاور *
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="سلام و درود، درخواست شما مطالعه شد..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    زمان پیشنهادی جلسه حضوری
                  </label>
                  <input
                    type="text"
                    value={suggestedSessionTime}
                    onChange={(e) => setSuggestedSessionTime(e.target.value)}
                    placeholder="مثال: شنبه ساعت ۱۶:۰۰"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    محل جلسه
                  </label>
                  <input
                    type="text"
                    value={sessionLocation}
                    onChange={(e) => setSessionLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAnsweringMsg(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال پاسخ به دانشجو</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
