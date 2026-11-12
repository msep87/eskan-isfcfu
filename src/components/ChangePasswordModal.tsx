import React, { useState } from 'react';
import { CurrentUser } from '../types';
import { Storage } from '../utils/storage';
import { KeyRound, Lock, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: NonNullable<CurrentUser>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!currentPassword || !newPassword) {
      setStatusMessage({ type: 'error', text: 'لطفاً تمامی فیلدها را تکمیل فرمایید.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'کلمه عبور جدید با تکرار آن یکسان نمی‌باشد.' });
      return;
    }

    let userId = '';
    if (currentUser.role === 'student') userId = currentUser.student.studentId;
    else if (currentUser.role === 'supervisor') userId = currentUser.supervisor.id;
    else if (currentUser.role === 'counselor') userId = currentUser.counselor.id;
    else if (currentUser.role === 'maintenance') userId = currentUser.technician.id;
    else if (currentUser.role === 'warehouse') userId = currentUser.staff.id;
    else userId = currentUser.username;

    const result = Storage.changePassword(
      currentUser.role,
      userId,
      currentPassword.trim(),
      newPassword.trim()
    );

    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1500);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              تغییر کلمه عبور
            </h3>
            <p className="text-xs text-slate-400">
              {currentUser.role === 'admin'
                ? 'تغییر رمز عبور مدیریت کل سامانه'
                : currentUser.role === 'supervisor'
                ? `تغییر رمز سرپرست (${currentUser.supervisor.fullName})`
                : currentUser.role === 'counselor'
                ? `تغییر رمز کارشناس مشاور (${currentUser.counselor.fullName})`
                : currentUser.role === 'maintenance'
                ? `تغییر رمز کارشناس تأسیسات (${currentUser.technician.fullName})`
                : currentUser.role === 'warehouse'
                ? `تغییر رمز مسئول انبار (${currentUser.staff.fullName})`
                : `تغییر رمز ورود دانشجو (${currentUser.student.fullName})`}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              کلمه عبور فعلی *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="کلمه عبور فعلی خود را وارد کنید"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 text-left dir-ltr"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              کلمه عبور جدید *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="حداقل ۴ کاراکتر"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 text-left dir-ltr"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              تکرار کلمه عبور جدید *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="تکرار کلمه عبور جدید"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500 text-left dir-ltr"
              dir="ltr"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              ثبت و تغییر کلمه عبور
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
