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
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: NonNullable<CurrentUser>) => void;
  onOpenUserGuide?: (role?: 'admin' | 'supervisor' | 'maintenance' | 'warehouse' | 'procurement' | 'counselor' | 'finance' | 'education' | 'student') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenUserGuide,
}) => {
  const [tab, setTab] = useState<'student' | 'supervisor' | 'counselor' | 'maintenance' | 'warehouse' | 'procurement' | 'finance' | 'education' | 'admin'>('student');

  // فرم دانشجو
  const [studentId, setStudentId] = useState('');
  const [nationalId, setNationalId] = useState('');

  // فرم سرپرست / مدیر / تأسیسات / انبار
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

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (tab === 'supervisor') {
      const supervisors = Storage.getSupervisors();
      const cleanU = toEnglishDigits(username.trim()).toLowerCase();
      const cleanP = toEnglishDigits(password.trim());
      const sup = supervisors.find(
        (s) =>
          toEnglishDigits(s.username.trim()).toLowerCase() === cleanU &&
          toEnglishDigits(s.password.trim()) === cleanP
      );
      if (sup) {
        Storage.addActivityLog({
          category: 'auth',
          action: 'ورود موفق سرپرست سرا',
          details: `سرپرست ${sup.fullName} (${sup.username}) وارد سامانه شد.`,
          targetName: sup.fullName,
          actorName: sup.fullName,
          actorRole: 'supervisor',
          actorUsername: sup.username,
        });
        onLoginSuccess({ role: 'supervisor', supervisor: sup });
        onClose();
      } else {
        Storage.addActivityLog({
          category: 'auth',
          action: 'تلاش ناموفق ورود سرپرست',
          details: `تلاش ناموفق ورود سرپرست با نام کاربری «${username.trim() || '-'}» ثبت شد.`,
          targetName: username.trim() || '-',
          severity: 'warning',
          actorName: 'کاربر مهمان',
          actorRole: 'system',
          actorUsername: username.trim(),
        });
        setErrorMsg('نام کاربری یا کلمه عبور سرپرست اشتباه است.');
      }
    } else if (tab === 'counselor') {
      const counselors = Storage.getCounselors();
      const cleanU = toEnglishDigits(username.trim()).toLowerCase();
      const cleanP = toEnglishDigits(password.trim());
      const cns = counselors.find(
        (c) =>
          toEnglishDigits(c.username.trim()).toLowerCase() === cleanU &&
          toEnglishDigits(c.password.trim()) === cleanP
      );
      if (cns) {
        if (cns.status === 'inactive' || cns.isActive === false) {
          Storage.addActivityLog({
            category: 'auth',
            action: 'تلاش ورود حساب غیرفعال مشاور',
            details: `کارشناس مشاور ${cns.fullName} (${cns.username}) با حساب غیرفعال تلاش به ورود کرد.`,
            targetName: cns.fullName,
            severity: 'warning',
            actorName: cns.fullName,
            actorRole: 'counselor',
            actorUsername: cns.username,
          });
          setErrorMsg('حساب کاربری مشاور غیرفعال است.');
          return;
        }
        Storage.addActivityLog({
          category: 'auth',
          action: 'ورود موفق کارشناس مشاور',
          details: `مشاور ${cns.fullName} (${cns.username}) وارد سامانه شد.`,
          targetName: cns.fullName,
          actorName: cns.fullName,
          actorRole: 'counselor',
          actorUsername: cns.username,
        });
        onLoginSuccess({ role: 'counselor', counselor: cns });
        onClose();
      } else {
        Storage.addActivityLog({
          category: 'auth',
          action: 'تلاش ناموفق ورود مشاور',
          details: `تلاش ناموفق ورود مشاور با نام کاربری «${cleanU || '-'}» ثبت شد.`,
          targetName: cleanU || '-',
          severity: 'warning',
          actorName: 'کاربر مهمان',
          actorRole: 'system',
          actorUsername: cleanU,
        });
        setErrorMsg('نام کاربری یا کلمه عبور کارشناس مشاور اشتباه است.');
      }
    } else if (tab === 'maintenance') {
      const staffList = Storage.getMaintenanceStaff();
      const cleanU = toEnglishDigits(username.trim()).toLowerCase();
      const cleanP = toEnglishDigits(password.trim());
      const tech = staffList.find(
        (s) =>
          toEnglishDigits(s.username.trim()).toLowerCase() === cleanU &&
          toEnglishDigits(s.password.trim()) === cleanP
      );
      if (tech) {
        if (tech.status === 'inactive' || tech.isActive === false) {
          Storage.addActivityLog({
            category: 'auth',
            action: 'تلاش ورود حساب غیرفعال تأسیسات',
            details: `کارشناس تأسیسات ${tech.fullName} (${tech.username}) با حساب غیرفعال تلاش به ورود کرد.`,
            targetName: tech.fullName,
            severity: 'warning',
            actorName: tech.fullName,
            actorRole: 'maintenance',
            actorUsername: tech.username,
          });
          setErrorMsg('حساب کاربری تکنسین غیرفعال شده است. لطفاً با مدیر سیستم تماس بگیرید.');
          return;
        }
        Storage.addActivityLog({
          category: 'auth',
          action: 'ورود موفق کارشناس تأسیسات',
          details: `تکنسین تأسیسات ${tech.fullName} (${tech.username}) وارد سامانه شد.`,
          targetName: tech.fullName,
          actorName: tech.fullName,
          actorRole: 'maintenance',
          actorUsername: tech.username,
        });
        onLoginSuccess({ role: 'maintenance', technician: tech });
        onClose();
      } else {
        Storage.addActivityLog({
          category: 'auth',
          action: 'تلاش ناموفق ورود تأسیسات',
          details: `تلاش ناموفق ورود تأسیسات با نام کاربری «${cleanU || '-'}» ثبت شد.`,
          targetName: cleanU || '-',
          severity: 'warning',
          actorName: 'کاربر مهمان',
          actorRole: 'system',
          actorUsername: cleanU,
        });
        setErrorMsg('نام کاربری یا کلمه عبور کارشناس تأسیسات اشتباه است.');
      }
    } else if (tab === 'warehouse') {
      const staffList = Storage.getWarehouseStaff();
      const cleanU = toEnglishDigits(username.trim()).toLowerCase();
      const cleanP = toEnglishDigits(password.trim());
      const wh = staffList.find(
        (s) =>
          toEnglishDigits(s.username.trim()).toLowerCase() === cleanU &&
          toEnglishDigits(s.password.trim()) === cleanP
      );
      if (wh) {
        if (wh.status === 'inactive' || wh.isActive === false) {
          Storage.addActivityLog({
            category: 'auth',
            action: 'تلاش ورود حساب غیرفعال انبار',
            details: `مسئول انبار ${wh.fullName} (${wh.username}) با حساب غیرفعال تلاش به ورود کرد.`,
            targetName: wh.fullName,
            severity: 'warning',
            actorName: wh.fullName,
            actorRole: 'warehouse',
            actorUsername: wh.username,
          });
          setErrorMsg('حساب کاربری پرسنل انبار غیرفعال است.');
          return;
        }
        Storage.addActivityLog({
          category: 'auth',
          action: 'ورود موفق مسئول انبار',
          details: `مسئول انبار ${wh.fullName} (${wh.username}) وارد سامانه شد.`,
          targetName: wh.fullName,
          actorName: wh.fullName,
          actorRole: 'warehouse',
          actorUsername: wh.username,
        });
        onLoginSuccess({ role: 'warehouse', staff: wh });
        onClose();
      } else {
        Storage.addActivityLog({
          category: 'auth',
          action: 'تلاش ناموفق ورود انبار',
          details: `تلاش ناموفق ورود مسئول انبار با نام کاربری «${cleanU || '-'}» ثبت شد.`,
          targetName: cleanU || '-',
          severity: 'warning',
          actorName: 'کاربر مهمان',
          actorRole: 'system',
          actorUsername: cleanU,
        });
        setErrorMsg('نام کاربری یا کلمه عبور مسئول انبار اشتباه است.');
      }
    } else if (tab === 'procurement') {
      const staffList = Storage.getProcurementStaff();
      const cleanU = toEnglishDigits(username.trim()).toLowerCase();
      const cleanP = toEnglishDigits(password.trim());
      const proc = staffList.find(
        (s) =>
          toEnglishDigits(s.username.trim()).toLowerCase() === cleanU &&
          toEnglishDigits(s.password.trim()) === cleanP
      );
      if (proc) {
        if (proc.status === 'inactive' || proc.isActive === false) {
          Storage.addActivityLog({
            category: 'auth',
            action: 'تلاش ورود حساب غیرفعال کارپرداز',
            details: `کارپرداز ${proc.fullName} (${proc.username}) با حساب غیرفعال تلاش به ورود کرد.`,
            targetName: proc.fullName,
            severity: 'warning',
            actorName: proc.fullName,
            actorRole: 'procurement',
            actorUsername: proc.username,
          });
          setErrorMsg('حساب کاربری کارپرداز غیرفعال است. لطفاً با مدیر سامانه تماس بگیرید.');
          return;
        }
        Storage.addActivityLog({
          category: 'auth',
          action: 'ورود موفق کارپرداز و خرید',
          details: `کارپرداز ${proc.fullName} (${proc.username}) وارد سامانه شد.`,
          targetName: proc.fullName,
          actorName: proc.fullName,
          actorRole: 'procurement',
          actorUsername: proc.username,
        });
        onLoginSuccess({ role: 'procurement', staff: proc });
        onClose();
      } else {
        Storage.addActivityLog({
          category: 'auth',
          action: 'تلاش ناموفق ورود کارپرداز',
          details: `تلاش ناموفق ورود کارپرداز با نام کاربری «${cleanU || '-'}» ثبت شد.`,
          targetName: cleanU || '-',
          severity: 'warning',
          actorName: 'کاربر مهمان',
          actorRole: 'system',
          actorUsername: cleanU,
        });
        setErrorMsg('نام کاربری یا کلمه عبور کارپرداز اشتباه است.');
      }
    } else if (tab === 'finance') {
      const staffList = Storage.getFinanceStaff();
      const cleanU = toEnglishDigits(username.trim()).toLowerCase();
      const cleanP = toEnglishDigits(password.trim());
      const fin = staffList.find(
        (s) =>
          toEnglishDigits(s.username.trim()).toLowerCase() === cleanU &&
          toEnglishDigits(s.password.trim()) === cleanP
      );
      if (fin) {
        if (fin.status === 'inactive' || fin.isActive === false) {
          Storage.addActivityLog({
            category: 'auth',
            action: 'تلاش ورود حساب غیرفعال امور مالی',
            details: `کارشناس امور مالی ${fin.fullName} (${fin.username}) با حساب غیرفعال تلاش به ورود کرد.`,
            targetName: fin.fullName,
            severity: 'warning',
            actorName: fin.fullName,
            actorRole: 'finance',
            actorUsername: fin.username,
          });
          setErrorMsg('حساب کاربری امور مالی غیرفعال است. لطفاً با مدیر سامانه تماس بگیرید.');
          return;
        }
        Storage.addActivityLog({
          category: 'auth',
          action: 'ورود موفق کارشناس امور مالی',
          details: `کارشناس امور مالی ${fin.fullName} (${fin.username}) وارد سامانه شد.`,
          targetName: fin.fullName,
          actorName: fin.fullName,
          actorRole: 'finance',
          actorUsername: fin.username,
        });
        onLoginSuccess({ role: 'finance', staff: fin });
        onClose();
      } else {
        Storage.addActivityLog({
          category: 'auth',
          action: 'تلاش ناموفق ورود امور مالی',
          details: `تلاش ناموفق ورود امور مالی با نام کاربری «${cleanU || '-'}» ثبت شد.`,
          targetName: cleanU || '-',
          severity: 'warning',
          actorName: 'کاربر مهمان',
          actorRole: 'system',
          actorUsername: cleanU,
        });
        setErrorMsg('نام کاربری یا کلمه عبور امور مالی اشتباه است.');
      }
    } else if (tab === 'education') {
      const staffList = Storage.getEducationStaff();
      const cleanU = toEnglishDigits(username.trim()).toLowerCase();
      const cleanP = toEnglishDigits(password.trim());
      const edu = staffList.find(
        (s) =>
          toEnglishDigits(s.username.trim()).toLowerCase() === cleanU &&
          toEnglishDigits(s.password.trim()) === cleanP
      );
      if (edu) {
        if (edu.status === 'inactive' || edu.isActive === false) {
          Storage.addActivityLog({
            category: 'auth',
            action: 'تلاش ورود حساب غیرفعال کارشناس آموزش',
            details: `کارشناس آموزش ${edu.fullName} (${edu.username}) با حساب غیرفعال تلاش به ورود کرد.`,
            targetName: edu.fullName,
            severity: 'warning',
            actorName: edu.fullName,
            actorRole: 'education',
            actorUsername: edu.username,
          });
          setErrorMsg('حساب کاربری کارشناس آموزش غیرفعال است. لطفاً با مدیر سامانه تماس بگیرید.');
          return;
        }
        Storage.addActivityLog({
          category: 'auth',
          action: 'ورود موفق کارشناس آموزش',
          details: `کارشناس آموزش ${edu.fullName} (${edu.username}) وارد سامانه شد.`,
          targetName: edu.fullName,
          actorName: edu.fullName,
          actorRole: 'education',
          actorUsername: edu.username,
        });
        onLoginSuccess({ role: 'education', staff: edu });
        onClose();
      } else {
        Storage.addActivityLog({
          category: 'auth',
          action: 'تلاش ناموفق ورود کارشناس آموزش',
          details: `تلاش ناموفق ورود کارشناس آموزش با نام کاربری «${cleanU || '-'}» ثبت شد.`,
          targetName: cleanU || '-',
          severity: 'warning',
          actorName: 'کاربر مهمان',
          actorRole: 'system',
          actorUsername: cleanU,
        });
        setErrorMsg('نام کاربری یا کلمه عبور کارشناس آموزش اشتباه است.');
      }
    } else if (tab === 'admin') {
      const currentAdminPass = toEnglishDigits(String(Storage.getSettings().adminPassword || '261').trim());
      const cleanAdminUser = toEnglishDigits(username.trim()).toLowerCase();
      const cleanAdminPass = toEnglishDigits(password.trim());
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
        onClose();
      } else {
        Storage.addActivityLog({
          category: 'auth',
          action: 'تلاش ناموفق ورود مدیر کل',
          details: `تلاش ناموفق ورود با نام کاربری «${username.trim() || '-'}» در بخش مدیر کل ثبت شد.`,
          targetName: username.trim() || '-',
          severity: 'critical',
          actorName: 'کاربر مهمان',
          actorRole: 'system',
          actorUsername: username.trim(),
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

        {/* تب‌های انتخاب نقش */}
        <div className="grid grid-cols-3 sm:grid-cols-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 gap-1">
          <button
            onClick={() => {
              setTab('student');
              setErrorMsg('');
            }}
            className={`py-2 text-[10px] sm:text-[11px] font-bold rounded-xl transition text-center cursor-pointer ${
              tab === 'student'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            دانشجو
          </button>
          <button
            onClick={() => {
              setTab('supervisor');
              setErrorMsg('');
              setRecoverySuccessMsg('');
              resetRecoveryState();
            }}
            className={`py-2 text-[10px] sm:text-[11px] font-bold rounded-xl transition text-center cursor-pointer ${
              tab === 'supervisor'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            سرپرست
          </button>
          <button
            onClick={() => {
              setTab('counselor');
              setErrorMsg('');
              setRecoverySuccessMsg('');
              resetRecoveryState();
            }}
            className={`py-2 text-[10px] sm:text-[11px] font-bold rounded-xl transition text-center cursor-pointer ${
              tab === 'counselor'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            مشاور
          </button>
          <button
            onClick={() => {
              setTab('maintenance');
              setErrorMsg('');
              setRecoverySuccessMsg('');
              resetRecoveryState();
            }}
            className={`py-2 text-[10px] sm:text-[11px] font-bold rounded-xl transition text-center cursor-pointer ${
              tab === 'maintenance'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            تأسیسات
          </button>
          <button
            onClick={() => {
              setTab('warehouse');
              setErrorMsg('');
              setRecoverySuccessMsg('');
              resetRecoveryState();
            }}
            className={`py-2 text-[10px] sm:text-[11px] font-bold rounded-xl transition text-center cursor-pointer ${
              tab === 'warehouse'
                ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            انبار
          </button>
          <button
            onClick={() => {
              setTab('procurement');
              setErrorMsg('');
              setRecoverySuccessMsg('');
              resetRecoveryState();
            }}
            className={`py-2 text-[10px] sm:text-[11px] font-bold rounded-xl transition text-center cursor-pointer ${
              tab === 'procurement'
                ? 'bg-white dark:bg-slate-700 text-orange-700 dark:text-orange-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            کارپرداز
          </button>
          <button
            onClick={() => {
              setTab('finance');
              setErrorMsg('');
              setRecoverySuccessMsg('');
              resetRecoveryState();
            }}
            className={`py-2 text-[10px] sm:text-[11px] font-bold rounded-xl transition text-center cursor-pointer ${
              tab === 'finance'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            امور مالی
          </button>
          <button
            onClick={() => {
              setTab('education');
              setErrorMsg('');
              setRecoverySuccessMsg('');
              resetRecoveryState();
            }}
            className={`py-2 text-[10px] sm:text-[11px] font-bold rounded-xl transition text-center cursor-pointer ${
              tab === 'education'
                ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            آموزش
          </button>
          <button
            onClick={() => {
              setTab('admin');
              setErrorMsg('');
              setRecoverySuccessMsg('');
              resetRecoveryState();
            }}
            className={`py-2 text-[10px] sm:text-[11px] font-bold rounded-xl transition text-center cursor-pointer ${
              tab === 'admin'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            مدیر
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

        {/* فرم سرپرست، مشاور، تأسیسات، انبار، کارپرداز، امور مالی، کارشناس آموزش و مدیر */}
        {(tab === 'supervisor' || tab === 'counselor' || tab === 'admin' || tab === 'maintenance' || tab === 'warehouse' || tab === 'procurement' || tab === 'finance' || tab === 'education') && (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                نام کاربری
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  tab === 'counselor'
                    ? 'نام کاربری کارشناس مشاور'
                    : tab === 'warehouse'
                    ? 'نام کاربری مسئول انبار'
                    : tab === 'procurement'
                    ? 'نام کاربری کارپرداز و خرید'
                    : tab === 'finance'
                    ? 'نام کاربری امور مالی و حسابداری'
                    : tab === 'education'
                    ? 'نام کاربری کارشناس آموزش'
                    : tab === 'maintenance'
                    ? 'نام کاربری تکنسین تأسیسات'
                    : tab === 'supervisor'
                    ? 'نام کاربری سرپرست سرا'
                    : 'نام کاربری سازمانی مدیر'
                }
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
                placeholder="کلمه عبور"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-left dir-ltr"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 text-white rounded-2xl font-bold text-sm shadow-lg transition cursor-pointer mt-2 ${
                tab === 'counselor'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : tab === 'warehouse'
                  ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/25'
                  : tab === 'procurement'
                  ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/25'
                  : tab === 'finance'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : tab === 'education'
                  ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/25'
                  : tab === 'maintenance'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/25'
              }`}
            >
              {tab === 'supervisor'
                ? 'ورود سرپرست سرا'
                : tab === 'counselor'
                ? 'ورود به کارتابل مرکز مشاوره و روانشناسی'
                : tab === 'maintenance'
                ? 'ورود به کارتابل امور تأسیسات و فنی'
                : tab === 'warehouse'
                ? 'ورود به سامانه مدیریت انبار'
                : tab === 'procurement'
                ? 'ورود به کارتابل کارپردازی و خرید'
                : tab === 'finance'
                ? 'ورود به کارتابل امور مالی و حسابداری'
                : tab === 'education'
                ? 'ورود به کارتابل کارشناس آموزش'
                : 'ورود مدیر کل سامانه'}
            </button>
          </form>
        )}

        {/* دکمه دسترسی مستقیم به دفترچه راهنمای جامع کاربری و فایل PDF */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            راهنمای گام‌به‌گام و روش انجام کارها در سامانه:
          </div>
          <button
            type="button"
            onClick={() => onOpenUserGuide?.(tab)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>راهنمای کاربری (PDF)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
