import React, { useState } from 'react';
import { Storage } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import { CurrentUser } from '../types';
import {
  Building2,
  AlertCircle,
  X,
  BookOpen,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  GraduationCap,
  Users,
  Shield,
  Info,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: NonNullable<CurrentUser>) => void;
  onOpenUserGuide?: (
    role?:
      | 'admin'
      | 'supervisor'
      | 'maintenance'
      | 'warehouse'
      | 'procurement'
      | 'counselor'
      | 'finance'
      | 'education'
      | 'cultural'
      | 'student_affairs'
      | 'student'
  ) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenUserGuide,
}) => {
  const [tab, setTab] = useState<'student' | 'staff' | 'admin'>('student');

  // فرم دانشجو
  const [studentId, setStudentId] = useState('');
  const [nationalId, setNationalId] = useState('');

  // فرم کارکنان و مدیر
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  // وضعیت بازیابی رمز عبور دانشجو (دو سوال سه‌گزینه‌ای)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'identify' | 'questions'>('identify');
  const [recoveryStudentId, setRecoveryStudentId] = useState('');
  const [recoveryData, setRecoveryData] = useState<{
    studentId: string;
    fatherOptions: string[];
    birthDateOptions: string[];
  } | null>(null);
  const [selectedFatherName, setSelectedFatherName] = useState('');
  const [selectedBirthDate, setSelectedBirthDate] = useState('');

  if (!isOpen) return null;

  const resetRecoveryState = () => {
    setIsRecoveryMode(false);
    setRecoveryStep('identify');
    setRecoveryStudentId('');
    setRecoveryData(null);
    setSelectedFatherName('');
    setSelectedBirthDate('');
  };

  const handleCloseModal = () => {
    resetRecoveryState();
    setErrorMsg('');
    setRecoverySuccessMsg('');
    onClose();
  };

  const handleTabChange = (nextTab: 'student' | 'staff' | 'admin') => {
    setTab(nextTab);
    setErrorMsg('');
    setRecoverySuccessMsg('');
    if (nextTab !== 'student') {
      resetRecoveryState();
    }
  };

  const handleOpenRecovery = () => {
    setErrorMsg('');
    setRecoverySuccessMsg('');
    setSelectedFatherName('');
    setSelectedBirthDate('');
    const prefillId = studentId.trim();
    setRecoveryStudentId(prefillId);

    if (prefillId) {
      const res = Storage.getStudentRecoveryQuestions(prefillId);
      if (res.success && res.studentId && res.fatherOptions && res.birthDateOptions) {
        setRecoveryData({
          studentId: res.studentId,
          fatherOptions: res.fatherOptions,
          birthDateOptions: res.birthDateOptions,
        });
        setRecoveryStep('questions');
        setIsRecoveryMode(true);
        return;
      }
      if (!res.success && prefillId) {
        setErrorMsg(res.message);
      }
    }

    setRecoveryData(null);
    setRecoveryStep('identify');
    setIsRecoveryMode(true);
  };

  const handleFetchRecoveryQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setRecoverySuccessMsg('');

    const res = Storage.getStudentRecoveryQuestions(recoveryStudentId);
    if (!res.success || !res.studentId || !res.fatherOptions || !res.birthDateOptions) {
      setErrorMsg(res.message);
      return;
    }

    setRecoveryData({
      studentId: res.studentId,
      fatherOptions: res.fatherOptions,
      birthDateOptions: res.birthDateOptions,
    });
    setSelectedFatherName('');
    setSelectedBirthDate('');
    setRecoveryStep('questions');
  };

  const handleVerifyRecoveryAnswers = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!recoveryData) return;
    if (!selectedFatherName || !selectedBirthDate) {
      setErrorMsg('لطفاً پاسخ هر دو سوال امنیتی (نام پدر و تاریخ تولد) را انتخاب نمایید.');
      return;
    }

    const res = Storage.recoverStudentPassword(
      recoveryData.studentId,
      selectedFatherName,
      selectedBirthDate
    );

    if (res.success) {
      setStudentId(recoveryData.studentId);
      setNationalId('');
      resetRecoveryState();
      setRecoverySuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
      setSelectedFatherName('');
      setSelectedBirthDate('');
      const refreshed = Storage.getStudentRecoveryQuestions(recoveryData.studentId);
      if (refreshed.success && refreshed.studentId && refreshed.fatherOptions && refreshed.birthDateOptions) {
        setRecoveryData({
          studentId: refreshed.studentId,
          fatherOptions: refreshed.fatherOptions,
          birthDateOptions: refreshed.birthDateOptions,
        });
      }
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setRecoverySuccessMsg('');

    if (!studentId || !nationalId) {
      setErrorMsg('لطفاً شماره دانشجویی و کلمه عبور (کد ملی) را وارد نمایید.');
      return;
    }

    const students = Storage.getStudents();
    const cleanId = toEnglishDigits(studentId.trim());
    const cleanNat = toEnglishDigits(nationalId.trim());

    const student = students.find((s) => {
      if (!s.studentId || toEnglishDigits(String(s.studentId).trim()) !== cleanId) {
        return false;
      }
      const effectivePass = toEnglishDigits(String(s.password || s.nationalId || '').trim());
      return Boolean(effectivePass) && effectivePass === cleanNat;
    });

    if (student) {
      Storage.addActivityLog({
        category: 'auth',
        action: 'ورود موفق دانشجو',
        details: `دانشجو ${student.fullName} (${student.studentId}) وارد سامانه شد.`,
        targetName: `${student.fullName} (${student.studentId})`,
        actorName: student.fullName,
        actorRole: 'student',
        actorUsername: student.studentId,
      });
      onLoginSuccess({ role: 'student', student });
      handleCloseModal();
    } else {
      Storage.addActivityLog({
        category: 'auth',
        action: 'تلاش ناموفق ورود دانشجو',
        details: `تلاش ناموفق ورود با شماره دانشجویی «${cleanId}» ثبت شد.`,
        targetName: cleanId,
        severity: 'warning',
        actorName: 'کاربر مهمان',
        actorRole: 'system',
        actorUsername: cleanId,
      });
      setErrorMsg('اطلاعات وارد شده یافت نشد. شماره دانشجویی یا کلمه عبور (کد ملی) نادرست است.');
    }
  };

  const handleStaffOrAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (tab === 'staff') {
      const result = Storage.authenticateStaffByCredentials(username, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
        handleCloseModal();
      } else {
        setErrorMsg(result.message || 'نام کاربری یا کلمه عبور نادرست است.');
      }
      return;
    }

    if (tab === 'admin') {
      const cleanAdminUser = toEnglishDigits(username.trim()).toLowerCase();
      const cleanAdminPass = toEnglishDigits(password.trim());

      if (!cleanAdminUser || !cleanAdminPass) {
        setErrorMsg('لطفاً نام کاربری و کلمه عبور مدیر کل را وارد نمایید.');
        return;
      }

      const currentAdminPass = toEnglishDigits(
        String(Storage.getSettings().adminPassword || '261').trim()
      );
      if (cleanAdminUser === 'admin' && cleanAdminPass === currentAdminPass) {
        Storage.addActivityLog({
          category: 'auth',
          action: 'ورود موفق مدیر کل سامانه',
          details: 'مدیر کل سراهای دانشجویی (admin) با موفقیت وارد سامانه شد.',
          targetName: 'admin',
          actorName: 'مدیر کل سراهای دانشجویی',
          actorRole: 'admin',
          actorUsername: 'admin',
        });
        onLoginSuccess({ role: 'admin', name: 'مدیر کل سراهای دانشجویی', username: 'admin' });
        handleCloseModal();
      } else {
        Storage.addActivityLog({
          category: 'auth',
          action: 'تلاش ناموفق ورود مدیر کل',
          details: `تلاش ناموفق ورود با نام کاربری «${cleanAdminUser || '-'}» در بخش مدیر کل ثبت شد.`,
          targetName: cleanAdminUser || '-',
          severity: 'critical',
          actorName: 'کاربر مهمان',
          actorRole: 'system',
          actorUsername: cleanAdminUser,
        });
        setErrorMsg('نام کاربری یا کلمه عبور مدیر اشتباه است.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={handleCloseModal}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="بستن پنجره ورود"
        >
          <X className="w-5 h-5" />
        </button>

        {/* سربرگ لاگین */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-3 shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">ورود به سامانه سراهای دانشجویی</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">دانشگاه فرهنگیان استان اصفهان</p>
        </div>

        {/* سه دسته اصلی ورود: دانشجو، کارکنان و مدیر */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 gap-1.5">
          <button
            type="button"
            onClick={() => handleTabChange('student')}
            className={`py-2.5 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'student'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>دانشجو</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('staff')}
            className={`py-2.5 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'staff'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>کارکنان</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`py-2.5 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'admin'
                ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>مدیر</span>
          </button>
        </div>

        {recoverySuccessMsg && tab === 'student' && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{recoverySuccessMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* فرم ورود دانشجو یا بازیابی رمز عبور دانشجو */}
        {tab === 'student' && !isRecoveryMode && (
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                شماره دانشجویی
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="شماره دانشجویی"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-left dir-ltr"
                dir="ltr"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  کلمه عبور (پیش‌فرض: کد ملی)
                </label>
                <button
                  type="button"
                  onClick={handleOpenRecovery}
                  className="text-[11px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 inline-flex items-center gap-1 cursor-pointer transition"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>بازیابی رمز عبور</span>
                </button>
              </div>
              <input
                type="password"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="کد ملی ۱۰ رقمی یا رمز عبور"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-left dir-ltr"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-600/25 transition cursor-pointer mt-2"
            >
              ورود به سامانه دانشجو
            </button>
          </form>
        )}

        {/* بخش بازیابی رمز عبور دانشجو با دو سوال امنیتی سه‌گزینه‌ای */}
        {tab === 'student' && isRecoveryMode && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">بازیابی رمز عبور دانشجو به کد ملی</div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  {recoveryStep === 'identify'
                    ? 'شماره دانشجویی خود را وارد کنید تا دو سوال امنیتی سه‌گزینه‌ای برای احراز هویت نمایش داده شود.'
                    : 'به هر دو سوال سه‌گزینه‌ای زیر پاسخ صحیح دهید تا رمز عبور شما به همان کد ملی بازنشانی شود.'}
                </p>
              </div>
            </div>

            {recoveryStep === 'identify' ? (
              <form onSubmit={handleFetchRecoveryQuestions} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    شماره دانشجویی *
                  </label>
                  <input
                    type="text"
                    value={recoveryStudentId}
                    onChange={(e) => setRecoveryStudentId(e.target.value)}
                    placeholder="شماره دانشجویی خود را وارد کنید"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-left dir-ltr"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    نمایش سوالات امنیتی
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetRecoveryState();
                      setErrorMsg('');
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>بازگشت</span>
                  </button>
                </div>
              </form>
            ) : (
              recoveryData && (
                <form onSubmit={handleVerifyRecoveryAnswers} className="space-y-4">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">شماره دانشجویی:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                      {recoveryData.studentId}
                    </span>
                  </div>

                  {/* سوال اول: نام پدر */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      ۱. نام پدر شما کدام گزینه است؟
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {recoveryData.fatherOptions.map((option, idx) => {
                        const isSelected = selectedFatherName === option;
                        return (
                          <button
                            key={`father_${idx}_${option}`}
                            type="button"
                            onClick={() => setSelectedFatherName(option)}
                            className={`px-2.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* سوال دوم: تاریخ تولد */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      ۲. تاریخ تولد شما کدام گزینه است؟
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {recoveryData.birthDateOptions.map((option, idx) => {
                        const isSelected = selectedBirthDate === option;
                        return (
                          <button
                            key={`birth_${idx}_${option}`}
                            type="button"
                            onClick={() => setSelectedBirthDate(option)}
                            dir="ltr"
                            className={`px-2 py-2.5 rounded-xl border text-xs font-mono font-bold transition cursor-pointer text-center ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      تأیید و بازیابی رمز به کد ملی
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetRecoveryState();
                        setErrorMsg('');
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>بازگشت</span>
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        )}

        {/* فرم ورود یکپارچه کارکنان (هدایت خودکار به پنل تخصصی بر اساس نام کاربری و رمز) و مدیر کل */}
        {(tab === 'staff' || tab === 'admin') && (
          <form onSubmit={handleStaffOrAdminLogin} className="space-y-4">
            {tab === 'staff' && (
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 flex items-start gap-2 text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                <span>
                  همکاران گرامی (سرپرست سرا، تأسیسات، مشاور، انبار، کارپردازی، امور مالی، کارشناس آموزش، امور فرهنگی و امور دانشجویی) با وارد کردن نام کاربری و کلمه عبور خود، به‌صورت خودکار به پنل کاربری اختصاصی خود هدایت می‌شوند.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {tab === 'admin' ? 'نام کاربری مدیر کل' : 'نام کاربری سازمانی'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={tab === 'admin' ? 'admin' : 'نام کاربری پرسنلی'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-left dir-ltr"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                کلمه عبور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'admin' ? 'کلمه عبور مدیر کل' : 'کلمه عبور'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-left dir-ltr"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 text-white rounded-2xl font-bold text-sm shadow-lg transition cursor-pointer mt-2 ${
                tab === 'admin'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
              }`}
            >
              {tab === 'admin' ? 'ورود مدیر کل سامانه' : 'ورود به کارتابل تخصصی کارکنان'}
            </button>
          </form>
        )}

        {/* دکمه دسترسی مستقیم به دفترچه راهنمای جامع کاربری و فایل PDF */}
        <div className="mt-6 pt-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 rounded-2xl px-3.5 py-3 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            راهنمای گام‌به‌گام و روش انجام کارها در سامانه:
          </div>
          <button
            type="button"
            onClick={() =>
              onOpenUserGuide?.(tab === 'student' ? 'student' : tab === 'admin' ? 'admin' : 'supervisor')
            }
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800 shadow-xs shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>راهنمای کاربری (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
