import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  BookOpen,
  Search,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Shield,
  Building2,
  Wrench,
  Layers,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Info,
  Calendar,
  Clock,
  QrCode,
  FileSpreadsheet,
  AlertTriangle,
  DoorOpen,
  CheckCheck,
  Bed,
  Users,
  FileText,
} from 'lucide-react';
import {
  ROLE_GUIDES,
  UserRoleType,
  generatePrintableRoleGuideHtml,
} from '../utils/guideData';
import { FarhangianEmblem } from './FarhangianEmblem';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRoleType;
  customLogoUrl?: string;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'student',
  customLogoUrl,
}) => {
  const [activeRole, setActiveRole] = useState<UserRoleType>(initialRole);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentGuide = ROLE_GUIDES[activeRole] || ROLE_GUIDES.student;

  // فیلتر مراحل بر اساس جستجو
  const filteredSteps = currentGuide.steps.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.instructions.some((ins) => ins.toLowerCase().includes(q)) ||
      s.proTips.some((tip) => tip.toLowerCase().includes(q))
    );
  });

  const getRoleIcon = (role: UserRoleType) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'supervisor':
        return <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'warehouse':
        return <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'student':
        return <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const handlePrint = () => {
    generatePrintableRoleGuideHtml(activeRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh]">

        {/* سربرگ مدرن مودال راهنما */}
        <div className="relative bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 shrink-0 border-b border-teal-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 backdrop-blur-md p-2 border border-teal-400/30 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-400/30">
                    دفترچه راهنمای رسمی کاربران
                  </span>
                  <span className="text-[11px] text-teal-200/80">
                    سال تحصیلی ۱۴۰۵-۱۴۰۶
                  </span>
                </div>
                <h3 className="font-black text-lg sm:text-xl text-white mt-0.5">
                  راهنمای متنی و تصویری کاربری سامانه جامع سراها
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
                title="چاپ یا ذخیره راهنمای این نقش به فرمت PDF (A4)"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">چاپ / ذخیره PDF</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* تب‌های انتخاب نقش با استایل مشخص */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-5">
            {(
              [
                { id: 'admin', label: 'مدیر کل پردیس', role: 'admin' as UserRoleType },
                { id: 'supervisor', label: 'سرپرست سرا', role: 'supervisor' as UserRoleType },
                { id: 'counselor', label: 'مشاور و روانشناس', role: 'counselor' as UserRoleType },
                { id: 'maintenance', label: 'تأسیسات و فنی', role: 'maintenance' as UserRoleType },
                { id: 'warehouse', label: 'انبار و تجهیزات', role: 'warehouse' as UserRoleType },
                { id: 'student', label: 'دانشجومعلم', role: 'student' as UserRoleType },
              ] as const
            ).map((tab) => {
              const isActive = activeRole === tab.role;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveRole(tab.role);
                    setSearchQuery('');
                  }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer border ${
                    isActive
                      ? 'bg-teal-500 text-white border-teal-400 shadow-md scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  }`}
                >
                  {getRoleIcon(tab.role)}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* کادر جستجو و خلاصه نقش */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${currentGuide.badgeColor}`}>
                {currentGuide.roleBadge}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {currentGuide.audienceDescription}
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در دستورالعمل‌ها و مراحل..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-600" />
              <span>ورود اولیه به سامانه: <strong>{currentGuide.defaultLoginHint}</strong></span>
            </div>
            <div className="text-slate-400">
              طراحی و مستندسازی: دکتر محمد سپیانی (m.sep87@gmail.com)
            </div>
          </div>
        </div>

        {/* محتوای اسکرول‌پذیر راهنما */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-right">

          {/* بخش ۱: مسئولیت‌ها و دسترسی‌های کلیدی نقش */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                امکانات و وظایف محوری این نقش در سامانه
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              {currentGuide.coreResponsibilities.map((resp, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{resp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* بخش ۲: مراحل گام به گام همراه با تصویرسازی Mock UI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>دستورالعمل‌های گام‌به‌گام و روش انجام کارها (متنی و تصویری)</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                {filteredSteps.length} دستورالعمل موجود
              </span>
            </div>

            {filteredSteps.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-400 text-xs">
                موردی منطبق با عبارت «{searchQuery}» یافت نشد.
              </div>
            ) : (
              filteredSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 transition hover:border-teal-500/40"
                >
                  {/* سربرگ گام */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-[10px] border border-teal-200 dark:border-teal-800 mb-1">
                        {step.phase}
                      </span>
                      <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {idx + 1}. {step.title}
                      </h5>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {step.summary}
                  </p>

                  {/* بازنمایی بصری / Mock UI Card ویژه هر مرحله */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-2 border-b border-slate-800">
                      <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        نمای بصری و اجزای رابط کاربری این بخش
                      </span>
                      <span className="text-[10px] text-slate-400">نمای شماتیک در پنل</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {step.visualHighlights.map((vh, vi) => (
                        <div
                          key={vi}
                          className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2.5"
                        >
                          <div className={`w-8 h-8 rounded-lg ${vh.color} text-white flex items-center justify-center shrink-0 shadow-xs text-xs font-bold`}>
                            {vi + 1}
                          </div>
                          <div className="overflow-hidden">
                            <span className="block text-xs font-bold text-white truncate">
                              {vh.label}
                            </span>
                            <span className="block text-[10px] text-slate-400 truncate">
                              {vh.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* مراحل متنی به صورت شماره‌گذاری شده */}
                  <div className="space-y-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                      مراحل دقیق اقدام:
                    </span>
                    <div className="space-y-1.5">
                      {step.instructions.map((ins, ii) => (
                        <div key={ii} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5 border border-teal-200 dark:border-teal-800">
                            {ii + 1}
                          </span>
                          <span className="leading-relaxed">{ins}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* نکات طلایی و پرسنلی */}
                  {step.proTips && step.proTips.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>نکات کلیدی و تجربی:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 pr-2 text-[11px] leading-relaxed">
                        {step.proTips.map((tip, ti) => (
                          <li key={ti}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* بخش ۳: پرسش‌های متداول و خطاهای رایج */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-600" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                پرسش‌های متداول و راهنمایی‌های تکمیلی
              </h4>
            </div>

            <div className="space-y-2">
              {currentGuide.commonQuestions.map((q, qi) => {
                const isOpen = expandedFaq === qi;
                return (
                  <div
                    key={qi}
                    className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : qi)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/40 text-right flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <span>{q.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition transform ${
                          isOpen ? 'rotate-180 text-teal-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-3 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                        {q.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* نوار پایین مودال راهنما */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FarhangianEmblem size={24} customLogoUrl={customLogoUrl} />
            <span>دانشگاه فرهنگیان • سامانه جامع سراهای دانشجویی (طراحی: دکتر محمد سپیانی)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ / دانلود PDF این نقش</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
