import React, { useState } from 'react';
import { PersianDatePicker } from './PersianDatePicker';
import { PersianTimePicker } from './PersianTimePicker';
import {
  Student,
  Dormitory,
  Room,
  GuestEligibilityType,
  GuestRequest,
} from '../types';
import { Storage } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import {
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileCheck2,
  Ban,
  Info,
  UtensilsCrossed,
  Users,
  ShieldAlert,
  Building2,
  Send,
  Trash2,
} from 'lucide-react';

interface StudentGuestRequestPanelProps {
  student: Student;
  dorm?: Dormitory;
  room?: Room;
  roommatesCount: number;
  onDataChanged: () => void;
}

const IRAN_PROVINCES = [
  'آذربایجان شرقی',
  'آذربایجان غربی',
  'اردبیل',
  'اصفهان',
  'البرز',
  'ایلام',
  'بوشهر',
  'تهران',
  'چهارمحال و بختیاری',
  'خراسان جنوبی',
  'خراسان رضوی',
  'خراسان شمالی',
  'خوزستان',
  'زنجان',
  'سمنان',
  'سیستان و بلوچستان',
  'فارس',
  'قزوین',
  'قم',
  'کردستان',
  'کرمان',
  'کرمانشاه',
  'کهگیلویه و بویراحمد',
  'گلستان',
  'گیلان',
  'لرستان',
  'مازندران',
  'مرکزی',
  'هرمزگان',
  'همدان',
  'یزد',
];

const FIRST_DEGREE_RELATIONS = ['پدر', 'مادر', 'خواهر', 'برادر', 'همسر', 'فرزند'];

export const StudentGuestRequestPanel: React.FC<StudentGuestRequestPanelProps> = ({
  student,
  dorm,
  room,
  roommatesCount,
  onDataChanged,
}) => {
  const [eligibilityType, setEligibilityType] = useState<GuestEligibilityType>('first_degree_relative');
  const [relationshipToStudent, setRelationshipToStudent] = useState('برادر');
  const [guestFullName, setGuestFullName] = useState('');
  const [guestNationalId, setGuestNationalId] = useState('');
  const [guestFatherName, setGuestFatherName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestProvince, setGuestProvince] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [guestStudentId, setGuestStudentId] = useState('');
  const [guestUniversityName, setGuestUniversityName] = useState('');
  const [guestFieldOfStudy, setGuestFieldOfStudy] = useState('');

  const [stayDuration, setStayDuration] = useState('۱ شب (۲۴ ساعت)');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('۱۴:۰۰');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('۱۲:۰۰');
  const [visitReason, setVisitReason] = useState('');

  const [fullResponsibilityAccepted, setFullResponsibilityAccepted] = useState(false);
  const [noSelfFoodAccepted, setNoSelfFoodAccepted] = useState(false);
  const [roommatesConsentConfirmed, setRoommatesConsentConfirmed] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const myRequests: GuestRequest[] = Storage.getGuestRequests().filter(
    (r) => r.studentId === student.studentId
  );

  const normProvince = guestProvince.replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim();
  const isIsfahanSelectedForStudentGuest =
    eligibilityType === 'other_province_farhangian' && normProvince.includes('اصفهان');
  const isIneligible = eligibilityType === 'other_ineligible' || isIsfahanSelectedForStudentGuest;

  const hasAssignedRoom = Boolean(student.isProfileCompleted && student.assignedDormId && student.assignedRoomId);

  const handleEligibilityChange = (next: GuestEligibilityType) => {
    setEligibilityType(next);
    setFeedback(null);
    if (next === 'first_degree_relative') {
      if (!FIRST_DEGREE_RELATIONS.includes(relationshipToStudent)) {
        setRelationshipToStudent('برادر');
      }
    } else if (next === 'other_province_farhangian') {
      setRelationshipToStudent('دانشجوی دانشگاه فرهنگیان استان دیگر');
    } else {
      setRelationshipToStudent('سایر');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!hasAssignedRoom) {
      setFeedback({
        type: 'error',
        text: 'ثبت درخواست مهمان تنها پس از تکمیل پرونده و داشتن اتاق تخصیص‌یافته در سرا امکان‌پذیر است.',
      });
      return;
    }

    if (isIneligible) {
      setFeedback({
        type: 'error',
        text: 'بر اساس مقررات دانشگاه، مهمان باید از اقوام درجه یک دانشجو یا دانشجوی دانشگاه فرهنگیان استان دیگری باشد؛ در غیر این صورت امکان درخواست وجود ندارد.',
      });
      return;
    }

    const cleanNationalId = toEnglishDigits(guestNationalId).replace(/\D/g, '');
    if (cleanNationalId.length !== 10) {
      setFeedback({
        type: 'error',
        text: 'کد ملی مهمان باید دقیقاً ۱۰ رقم معتبر باشد.',
      });
      return;
    }

    const cleanPhone = toEnglishDigits(guestPhone).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFeedback({
        type: 'error',
        text: 'شماره همراه مهمان باید معتبر و حداقل ۱۰ رقم باشد.',
      });
      return;
    }

    const res = Storage.createGuestRequest({
      studentId: student.studentId,
      eligibilityType,
      relationshipToStudent,
      guestFullName,
      guestNationalId: cleanNationalId,
      guestFatherName,
      guestPhone: cleanPhone,
      guestProvince,
      guestCity,
      guestStudentId:
        eligibilityType === 'other_province_farhangian'
          ? toEnglishDigits(guestStudentId).trim()
          : undefined,
      guestUniversityName:
        eligibilityType === 'other_province_farhangian' ? guestUniversityName : undefined,
      guestFieldOfStudy:
        eligibilityType === 'other_province_farhangian' ? guestFieldOfStudy : undefined,
      stayDuration,
      arrivalDate: toEnglishDigits(arrivalDate),
      arrivalTime: toEnglishDigits(arrivalTime),
      departureDate: toEnglishDigits(departureDate),
      departureTime: toEnglishDigits(departureTime),
      visitReason,
      fullResponsibilityAccepted,
      noSelfFoodAccepted,
      roommatesConsentConfirmed,
    });

    if (!res.success) {
      setFeedback({ type: 'error', text: res.message });
      return;
    }

    setFeedback({ type: 'success', text: res.message });
    setGuestFullName('');
    setGuestNationalId('');
    setGuestFatherName('');
    setGuestPhone('');
    setGuestCity('');
    setGuestStudentId('');
    setGuestUniversityName('');
    setGuestFieldOfStudy('');
    setVisitReason('');
    setFullResponsibilityAccepted(false);
    setNoSelfFoodAccepted(false);
    setRoommatesConsentConfirmed(false);
    onDataChanged();
  };

  const handleCancelRequest = (id: string) => {
    const res = Storage.cancelGuestRequest(id, student.studentId);
    setConfirmCancelId(null);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      onDataChanged();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* بخش فرم ثبت درخواست موافقت با مهمان */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                فرم درخواست موافقت با مهمان در سرای دانشجویی
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                این درخواست جهت بررسی و موافقت به کارتابل سرپرستی سرای شما ارسال می‌شود و پس از موافقت، با مراجعه به سرپرستی مدارک را تحویل دهید.
              </p>
            </div>
          </div>

          {hasAssignedRoom && (
            <div className="px-3.5 py-2 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-800 dark:text-teal-200 flex items-center gap-2 shrink-0">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>
                {dorm?.name || student.assignedDormName} — اتاق {room?.roomNumber || student.assignedRoomNumber}
              </span>
            </div>
          )}
        </div>

        {/* ضوابط پذیرش مهمان */}
        <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 space-y-1.5 leading-relaxed">
          <div className="font-black flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
            <Info className="w-4 h-4 shrink-0" />
            <span>ضوابط و شرایط قانونی پذیرش مهمان در سرا:</span>
          </div>
          <ul className="list-disc pr-5 space-y-1 text-[11px] sm:text-xs">
            <li>
              مهمان حتماً باید <strong>از اقوام درجه یک دانشجو</strong> (پدر، مادر، خواهر، برادر، همسر یا فرزند) و یا{' '}
              <strong>دانشجوی دانشگاه فرهنگیان استان دیگری</strong> باشد. در غیر این صورت امکان ثبت درخواست وجود ندارد.
            </li>
            <li>مسئولیت کامل تمام اقدامات مهمان در مدت اقامت بر عهده دانشجوی میزبان است و غذای سلف به مهمان تعلق نمی‌گیرد.</li>
            <li>حضور مهمان در اتاق صرفاً با رضایت کامل تمامی ساکنین اتاق امکان‌پذیر است.</li>
            <li>در صورت موافقت سرپرست سرا، جهت تکمیل فرآیند به دفتر سرپرستی مراجعه و مدارک شناسایی/دانشجویی را تحویل دهید.</li>
          </ul>
        </div>

        {!hasAssignedRoom && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-black">امکان ثبت درخواست مهمان در وضعیت فعلی وجود ندارد</div>
              <p>
                برای ثبت درخواست مهمان لازم است ابتدا پرونده اسکان خود را تکمیل کرده و یک اتاق و تخت فعال در یکی از سراهای دانشجویی داشته باشید.
              </p>
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="leading-relaxed">{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ۱. انتخاب شرط احراز مهمان */}
          <div className="space-y-2.5">
            <label className="block text-xs font-black text-slate-800 dark:text-slate-100">
              ۱. وضعیت احراز شرایط مهمان (انتخاب الزامی) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleEligibilityChange('first_degree_relative')}
                className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer ${
                  eligibilityType === 'first_degree_relative'
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="font-extrabold text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>اقوام درجه یک دانشجو</span>
                </div>
                <div className="text-[11px] opacity-80 mt-1">
                  پدر، مادر، خواهر، برادر، همسر یا فرزند
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleEligibilityChange('other_province_farhangian')}
                className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer ${
                  eligibilityType === 'other_province_farhangian'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="font-extrabold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>دانشجوی فرهنگیان استان دیگر</span>
                </div>
                <div className="text-[11px] opacity-80 mt-1">
                  دانشجومعلمان دانشگاه فرهنگیان سایر استان‌ها (بجز اصفهان)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleEligibilityChange('other_ineligible')}
                className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer ${
                  eligibilityType === 'other_ineligible'
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="font-extrabold text-xs flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-rose-600" />
                  <span>سایر افراد (غیرمشمول)</span>
                </div>
                <div className="text-[11px] opacity-80 mt-1">
                  سایر بستگان یا دانشجویان غیردانشگاه فرهنگیان
                </div>
              </button>
            </div>
          </div>

          {/* هشدار مسدودسازی در صورت عدم احراز شرط */}
          {isIneligible && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-400 dark:border-rose-800 text-rose-900 dark:text-rose-100 flex items-start gap-3">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-black text-sm">
                  امکان ثبت درخواست برای این مهمان وجود ندارد
                </div>
                <p className="leading-relaxed">
                  {isIsfahanSelectedForStudentGuest
                    ? 'دانشجوی دانشگاه فرهنگیان باید از استان دیگری (غیراز استان اصفهان) باشد. برای دانشجویان دانشگاه فرهنگیان استان اصفهان امکان ثبت درخواست مهمان وجود ندارد.'
                    : 'طبق آیین‌نامه سراهای دانشجویی، مهمان باید یا از اقوام درجه یک دانشجو باشد و یا دانشجوی دانشگاه فرهنگیان استان دیگری باشد. در غیر این صورت امکان درخواست وجود ندارد.'}
                </p>
              </div>
            </div>
          )}

          {/* ۲. مشخصات کامل مهمان و نسبت با دانشجو */}
          <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
              ۲. مشخصات هویتی مهمان و نسبت با دانشجو
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی مهمان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={guestFullName}
                  onChange={(e) => setGuestFullName(e.target.value)}
                  placeholder="مثلاً علیرضا محمدی"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نسبت مهمان با دانشجو <span className="text-rose-500">*</span>
                </label>
                {eligibilityType === 'first_degree_relative' ? (
                  <select
                    value={relationshipToStudent}
                    onChange={(e) => setRelationshipToStudent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold focus:ring-2 focus:ring-teal-500"
                  >
                    {FIRST_DEGREE_RELATIONS.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={relationshipToStudent}
                    onChange={(e) => setRelationshipToStudent(e.target.value)}
                    placeholder="مثلاً هم‌دانشگاهی دانشگاه فرهنگیان استان یزد"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  کد ملی مهمان (۱۰ رقم) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={guestNationalId}
                  onChange={(e) => setGuestNationalId(toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                  placeholder="1270000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-left focus:ring-2 focus:ring-teal-500"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام پدر مهمان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={guestFatherName}
                  onChange={(e) => setGuestFatherName(e.target.value)}
                  placeholder="نام پدر"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره همراه مهمان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                  placeholder="09120000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-left focus:ring-2 focus:ring-teal-500"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  استان مبدأ / محل سکونت مهمان <span className="text-rose-500">*</span>
                </label>
                <select
                  value={guestProvince}
                  onChange={(e) => setGuestProvince(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">انتخاب استان...</option>
                  {IRAN_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شهر مبدأ مهمان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={guestCity}
                  onChange={(e) => setGuestCity(e.target.value)}
                  placeholder="مثلاً شیراز / یزد / قم"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {eligibilityType === 'other_province_farhangian' && (
                <>
                  <div>
                    <label className="block font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                      کد دانشجویی مهمان در دانشگاه فرهنگیان <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={guestStudentId}
                      onChange={(e) => setGuestStudentId(toEnglishDigits(e.target.value))}
                      placeholder="کد دانشجویی مهمان"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 font-mono text-left focus:ring-2 focus:ring-indigo-500"
                      dir="ltr"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                      نام پردیس / مرکز فرهنگیان مبدأ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={guestUniversityName}
                      onChange={(e) => setGuestUniversityName(e.target.value)}
                      placeholder="مثلاً پردیس شهید باهنر شیراز"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                      رشته تحصیلی مهمان
                    </label>
                    <input
                      type="text"
                      value={guestFieldOfStudy}
                      onChange={(e) => setGuestFieldOfStudy(e.target.value)}
                      placeholder="مثلاً آموزش ابتدایی"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ۳. زمان‌بندی ورود، خروج و مدت اقامت درخواستی */}
          <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>۳. مدت اقامت درخواستی، تاریخ و زمان دقیق ورود و خروج</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مدت اقامت درخواستی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={stayDuration}
                  onChange={(e) => setStayDuration(e.target.value)}
                  placeholder="مثلاً ۲ شب و ۲ روز"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ ورود (شمسی) <span className="text-rose-500">*</span>
                </label>
                <PersianDatePicker
                  value={arrivalDate}
                  onChange={setArrivalDate}
                  placeholder="1405/08/10"
                  digits="en"
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  زمان (ساعت) ورود <span className="text-rose-500">*</span>
                </label>
                <PersianTimePicker
                  value={arrivalTime}
                  onChange={setArrivalTime}
                  placeholder="14:00"
                  digits="en"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ خروج (شمسی) <span className="text-rose-500">*</span>
                </label>
                <PersianDatePicker
                  value={departureDate}
                  onChange={setDepartureDate}
                  placeholder="1405/08/12"
                  digits="en"
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  زمان (ساعت) خروج <span className="text-rose-500">*</span>
                </label>
                <PersianTimePicker
                  value={departureTime}
                  onChange={setDepartureTime}
                  placeholder="12:00"
                  digits="en"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                علت مراجعه / توضیحات تکمیلی (اختیاری)
              </label>
              <textarea
                rows={2}
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
                placeholder="توضیحات لازم برای بررسی سرپرستی سرا..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* ۴. تعهدنامه الزامی دانشجو */}
          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800">
            <h4 className="font-black text-xs sm:text-sm text-amber-950 dark:text-amber-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <span>۴. تعهدات الزامی دانشجوی میزبان (تأیید هر سه بند جهت ارسال درخواست ضروری است)</span>
            </h4>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-200/80 dark:border-amber-900 cursor-pointer hover:bg-white transition">
              <input
                type="checkbox"
                checked={fullResponsibilityAccepted}
                onChange={(e) => setFullResponsibilityAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-teal-600 rounded cursor-pointer shrink-0"
              />
              <span className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                تعهد می‌نمایم <strong>مسئولیت تمام اقدامات مهمان</strong> (مسائل انضباطی، امنیتی، خسارات احتمالی و رعایت مقررات سرا) در طول مدت حضور بر عهده اینجانب است.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-200/80 dark:border-amber-900 cursor-pointer hover:bg-white transition">
              <input
                type="checkbox"
                checked={noSelfFoodAccepted}
                onChange={(e) => setNoSelfFoodAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-teal-600 rounded cursor-pointer shrink-0"
              />
              <span className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-semibold flex items-start gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  مطلع هستم و می‌پذیرم که <strong>غذای سلف به مهمان تعلق نمی‌گیرد</strong> و هیچ‌گونه مطالبه تغذیه برای مهمان وجود نخواهد داشت.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-200/80 dark:border-amber-900 cursor-pointer hover:bg-white transition">
              <input
                type="checkbox"
                checked={roommatesConsentConfirmed}
                onChange={(e) => setRoommatesConsentConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-teal-600 rounded cursor-pointer shrink-0"
              />
              <span className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                تأیید و تعهد می‌نمایم <strong>حضور مهمان در اتاق با رضایت کامل ساکنین اتاق</strong>{' '}
                {room ? `(اتاق ${room.roomNumber} با ${roommatesCount} نفر ساکن فعلی)` : ''} امکان‌پذیر است و رضایت تمامی هم‌اتاقی‌ها قبلاً اخذ شده است.
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              پس از ثبت، درخواست مستقیماً به کارتابل سرپرستی سرای محل اسکان شما ارسال می‌شود.
            </span>

            <button
              type="submit"
              disabled={!hasAssignedRoom || isIneligible}
              className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ثبت و ارسال درخواست مهمان به سرپرست سرا</span>
            </button>
          </div>
        </form>
      </div>

      {/* بخش پیگیری و سوابق درخواست‌های مهمان دانشجو */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-teal-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              سوابق و وضعیت درخواست‌های مهمان شما ({myRequests.length})
            </h3>
          </div>
        </div>

        {myRequests.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            تاکنون هیچ درخواست مهمانی ثبت نکرده‌اید.
          </div>
        ) : (
          <div className="space-y-4">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className={`p-4 sm:p-5 rounded-2xl border space-y-3 text-xs ${
                  req.status === 'approved'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800'
                    : req.status === 'rejected'
                    ? 'bg-rose-50/60 dark:bg-rose-950/25 border-rose-300 dark:border-rose-800'
                    : req.status === 'cancelled'
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-75'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-[11px]">
                      {req.trackingCode}
                    </span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {req.guestFullName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                      نسبت: {req.relationshipToStudent}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold">
                      {req.eligibilityType === 'first_degree_relative'
                        ? 'اقوام درجه یک'
                        : 'دانشجوی فرهنگیان استان دیگر'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'pending_supervisor' && (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 font-extrabold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>در انتظار بررسی سرپرست سرا</span>
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>موافقت شد</span>
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold inline-flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رد شده</span>
                      </span>
                    )}
                    {req.status === 'cancelled' && (
                      <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 font-bold">
                        لغو شده
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    <strong>کد ملی / نام پدر:</strong>{' '}
                    <span className="font-mono">{req.guestNationalId}</span> / {req.guestFatherName}
                  </div>
                  <div>
                    <strong>استان و شهر:</strong> {req.guestProvince} - {req.guestCity}
                  </div>
                  <div>
                    <strong>مدت اقامت:</strong> {req.stayDuration}
                  </div>
                  <div>
                    <strong>ورود و خروج:</strong>{' '}
                    <span className="font-mono">
                      {req.arrivalDate} ({req.arrivalTime})
                    </span>{' '}
                    الی{' '}
                    <span className="font-mono">
                      {req.departureDate} ({req.departureTime})
                    </span>
                  </div>
                </div>

                {/* پیام موافقت سرپرست و دستورالعمل تحویل مدارک */}
                {req.status === 'approved' && (
                  <div className="p-3.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 space-y-1.5">
                    <div className="font-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-300 shrink-0" />
                      <span>با درخواست مهمان شما موافقت شد — مراجعه به سرپرستی و تحویل مدارک</span>
                    </div>
                    <p className="leading-relaxed">
                      لطفاً جهت تکمیل پذیرش مهمان، به <strong>دفتر سرپرستی {req.dormName}</strong> مراجعه نموده و{' '}
                      <strong>مدارک هویتی و دانشجویی معتبر مهمان</strong> را تحویل دهید.
                    </p>
                    {req.supervisorNotes && (
                      <div className="text-[11px] opacity-90 pt-1">
                        <strong>توضیحات سرپرست ({req.reviewedBy}):</strong> {req.supervisorNotes}
                      </div>
                    )}
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg font-extrabold ${
                          req.documentsSubmittedToSupervisor
                            ? 'bg-emerald-700 text-white'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {req.documentsSubmittedToSupervisor
                          ? `مدارک به سرپرستی تحویل داده شد (${req.documentsSubmittedAt || ''})`
                          : 'در انتظار مراجعه به سرپرستی و تحویل مدارک'}
                      </span>
                    </div>
                  </div>
                )}

                {req.status === 'rejected' && req.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-100/80 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                    <strong>علت عدم موافقت سرپرست ({req.reviewedBy}):</strong> {req.rejectionReason}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>ثبت در: {req.createdAt}</span>
                  {req.status === 'pending_supervisor' && (
                    <div>
                      {confirmCancelId === req.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-rose-600 font-bold">آیا لغو شود؟</span>
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(req.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                          >
                            بله، لغو کن
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(null)}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold cursor-pointer"
                          >
                            انصراف
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(req.id)}
                          className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>لغو درخواست</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
