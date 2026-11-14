import React, { useState } from 'react';
import { Storage } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import { CurrentUser } from '../types';
import {
  GraduationCap,
  Shield,
  UserCheck,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  AlertCircle,
  X,
  BookOpen,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: NonNullable<CurrentUser>) => void;
  onOpenUserGuide?: (role?: 'admin' | 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'student') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenUserGuide,
}) => {
  const [tab, setTab] = useState<'student' | 'supervisor' | 'counselor' | 'maintenance' | 'warehouse' | 'admin'>('student');

  // فرم دانشجو
  const [studentId, setStudentId] = useState('');
  const [nationalId, setNationalId] = useState('');

  // فرم سرپرست / مدیر / تأسیسات / انبار
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!studentId || !nationalId) {
      setErrorMsg('لطفاً شماره دانشجویی و کد ملی را وارد نمایید.');
      return;
    }

    const students = Storage.getStudents();
    const cleanId = toEnglishDigits(studentId.trim());
    const cleanNat = toEnglishDigits(nationalId.trim());

    const student = students.find(
      (s) =>
        Boolean(s.studentId) &&
        Boolean(s.nationalId) &&
        toEnglishDigits(String(s.studentId).trim()) === cleanId &&
        toEnglishDigits(String(s.nationalId).trim()) === cleanNat
    );

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
      onClose();
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
      setErrorMsg('اطلاعات وارد شده یافت نشد. شماره دانشجویی یا کد ملی نادرست است.');
    }
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (tab === 'supervisor') {
      const supervisors = Storage.getSupervisors();
      const sup = supervisors.find(
        (s) => s.username === username.trim() && s.password === password.trim()
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
      const cleanU = username.trim().toLowerCase();
      const cns = counselors.find(
        (c) => c.username.toLowerCase() === cleanU && c.password.trim() === password.trim()
      );
      if (cns) {
        if (cns.status === 'inactive') {
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
      const cleanU = username.trim().toLowerCase();
      const tech = staffList.find(
        (s) => s.username.toLowerCase() === cleanU && s.password.trim() === password.trim()
      );
      if (tech) {
        if (tech.status === 'inactive') {
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
      const cleanU = username.trim().toLowerCase();
      const wh = staffList.find(
        (s) => s.username.toLowerCase() === cleanU && s.password.trim() === password.trim()
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
    } else if (tab === 'admin') {
      const currentAdminPass = Storage.getSettings().adminPassword || '261';
      if (username.trim() === 'admin' && password.trim() === currentAdminPass) {
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
        <div className="grid grid-cols-3 sm:grid-cols-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 gap-1">
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
              setTab('admin');
              setErrorMsg('');
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

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* فرم ورود دانشجو */}
        {tab === 'student' && (
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                کد ملی
              </label>
              <input
                type="password"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="کد ملی ۱۰ رقمی دانشجو"
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

        {/* فرم سرپرست، مشاور، تأسیسات، انبار و مدیر */}
        {(tab === 'supervisor' || tab === 'counselor' || tab === 'admin' || tab === 'maintenance' || tab === 'warehouse') && (
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
                    ? 'نام کاربری مسئول انبار و کارپردازی'
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
                ? 'ورود به سامانه انبار و کارپردازی'
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
