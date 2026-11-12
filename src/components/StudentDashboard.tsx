import React, { useState } from 'react';
import { Student, Dormitory, Room, Bed, Announcement, RoomWarning, AppSettings } from '../types';
import { RoommatesCard } from './RoommatesCard';
import { VisualBedPicker } from './VisualBedPicker';
import { StudentProfileModal } from './StudentProfileModal';
import { DormIdCardModal } from './DormIdCardModal';
import {
  User,
  Bed as BedIcon,
  Users,
  MessageSquare,
  Sparkles,
  Calendar,
  AlertTriangle,
  Bell,
  Clock,
  ShieldCheck,
  Building,
  CheckCircle,
  Camera,
  MapPin,
  Phone,
  GraduationCap,
  Lock,
  QrCode,
  Printer,
  BookOpen,
  HeartHandshake,
} from 'lucide-react';

interface StudentDashboardProps {
  student: Student;
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  announcements: Announcement[];
  warnings: RoomWarning[];
  settings: AppSettings;
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenUserGuide?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  dorms,
  rooms,
  beds,
  students,
  announcements,
  warnings,
  settings,
  onRefreshData,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  // تب‌های داشبورد
  const [activeTab, setActiveTab] = useState<'overview' | 'picker'>('overview');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);

  // دریافت اتاق و تخت دانشجو
  const studentBed = beds.find((b) => b.id === student.assignedBedId);
  const studentRoom = rooms.find((r) => r.id === student.assignedRoomId);
  const studentDorm = dorms.find((d) => d.id === student.assignedDormId);

  // هم‌اتاقی‌ها
  const roommates = studentRoom
    ? beds
        .filter((b) => b.roomId === studentRoom.id && b.studentId)
        .map((b) => ({
          bed: b,
          student: students.find((s) => s.studentId === b.studentId)!,
        }))
        .filter((item) => item.student)
    : [];

  // اخطارهای مربوط به اتاق این دانشجو
  const myRoomWarnings = studentRoom
    ? warnings.filter((w) => w.roomId === studentRoom.id)
    : [];

  return (
    <div className="space-y-6">

      {/* مدال تکمیل اجباری یا اختیاری پروفایل در اولین ورود */}
      <StudentProfileModal
        isOpen={isProfileModalOpen || !student.isProfileCompleted}
        onClose={() => setIsProfileModalOpen(false)}
        student={student}
        onProfileUpdated={() => onRefreshData()}
        isFirstLoginForce={!student.isProfileCompleted}
      />

      {/* بنر قرمز/امبر اخطار اجباری بودن تکمیل پرونده در صورت عدم تکمیل */}
      {!student.isProfileCompleted && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-500/10 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-pulse">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <div className="p-3 rounded-2xl bg-rose-600 text-white shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base">
                پرونده اسکان شما ناقص است! تکمیل اطلاعات در بدو ورود الزامی می‌باشد
              </div>
              <div className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                بر اساس مقررات دانشگاه فرهنگیان، دسترسی به انتخاب اتاق و خدمات رفاهی خوابگاه منوط به ثبت کامل اطلاعات فردی، تماس، نشانی و وضعیت سلامت است.
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black transition shrink-0 shadow-md shadow-rose-600/30 cursor-pointer hover:scale-105"
          >
            تکمیل فوری پرونده و فعال‌سازی
          </button>
        </div>
      )}

      {/* بنر خوش‌آمدگویی و کارت هویت دانشجو با تصویر بارگذاری شده */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-700/15 relative overflow-hidden">
        {/* المان‌های تزئینی پس‌زمینه */}
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">

            {/* عکس پرسنلی دانشجو (با دکمه تغییر) */}
            <div className="relative group">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white/80 shadow-xl"
                />
              ) : (
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-white text-3xl font-extrabold border-4 border-white/80 shadow-xl"
                  style={{ backgroundColor: student.avatarColor || '#0d9488' }}
                >
                  {student.fullName.slice(0, 2)}
                </div>
              )}

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="absolute -bottom-2 -left-2 p-2 rounded-2xl bg-white text-teal-800 shadow-lg hover:bg-slate-100 transition cursor-pointer"
                title="تغییر عکس و ویرایش مشخصات"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* مشخصات اصلی دانشجومعلم */}
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black">{student.fullName}</h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/20 font-bold backdrop-blur-xs">
                  دانشجومعلم دانشگاه فرهنگیان اصفهان
                </span>
              </div>

              <p className="text-xs sm:text-sm text-teal-100 flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 font-medium">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {student.fieldOfStudy} (ورودی {student.entryTerm})
                </span>
                <span>•</span>
                <span>کد دانشجویی: {student.studentId}</span>
                <span>•</span>
                <span>کد ملی: {student.nationalId}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-teal-50">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  ساکن: {student.province} - {student.city}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-cyan-200" />
                  همراه: <span dir="ltr">{student.mobile}</span>
                </span>
                {student.previousScore && (
                  <span className="bg-teal-800/50 px-2 py-0.5 rounded-lg border border-teal-500/30">
                    امتیاز انضباطی: {student.previousScore}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* کارت وضعیت اسکان در سربرگ */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center sm:text-right shrink-0 min-w-[210px]">
            <div className="text-[11px] text-teal-100 font-bold mb-1">وضعیت تخصیص خوابگاه:</div>
            {studentBed && studentRoom && studentDorm ? (
              <div>
                {student.assignmentStatus === 'temporary' ? (
                  <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-200 bg-amber-950/60 px-2 py-0.5 rounded-lg mb-1 border border-amber-400/40">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>تخصیص موقت (در انتظار تأیید)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded-lg mb-1 border border-emerald-400/40">
                    <CheckCircle className="w-3 h-3 text-emerald-300" />
                    <span>تخصیص قطعی و تأیید شده</span>
                  </div>
                )}
                <div className="font-extrabold text-base text-white">
                  اتاق {studentRoom.roomNumber} - {studentBed.label}
                </div>
                <div className="text-xs text-teal-100 mt-0.5">{studentDorm.name}</div>
              </div>
            ) : (
              <div>
                <div className="font-bold text-amber-300 text-sm">عدم تخصیص اتاق</div>
                <div className="text-[11px] text-teal-100">جهت انتخاب تخت اقدام فرمایید</div>
              </div>
            )}

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="mt-3 w-full py-1.5 px-3 rounded-xl bg-white text-teal-800 text-xs font-bold hover:bg-teal-50 transition cursor-pointer shadow-sm"
            >
              ویرایش پرونده و سلامت
            </button>

            <button
              onClick={() => setIsIdCardModalOpen(true)}
              className="mt-2 w-full py-1.5 px-3 rounded-xl bg-teal-900/60 hover:bg-teal-900 text-teal-100 hover:text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              <span>کارت شناسایی و پرینت</span>
            </button>

            {onOpenUserGuide && (
              <button
                onClick={onOpenUserGuide}
                className="mt-2 w-full py-1.5 px-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-900 text-indigo-100 hover:text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                title="مشاهده دفترچه راهنمای جامع دانشجو و دانلود PDF"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                <span>راهنمای کاربری (PDF)</span>
              </button>
            )}
          </div>
        </div>

        {/* بازه زمانی انتخاب اتاق و وضعیت سامانه */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-300" />
            <span>بازه زمانی مجاز انتخاب اتاق:</span>
            <span className="font-bold text-amber-200">{settings.selectionStartDate} تا {settings.selectionEndDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                settings.selectionActive ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span className="font-bold">
              {settings.selectionActive ? 'سامانه انتخاب تخت هم‌اکنون فعال است' : 'سامانه در حال حاضر غیرفعال است'}
            </span>
          </div>
        </div>
      </div>

      {/* بنر اطلاع‌رسانی وضعیت تخصیص موقت برای دانشجو */}
      {student.assignmentStatus === 'temporary' && studentRoom && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm block mb-0.5">اسکان شما در وضعیت «تخصیص موقت» قرار دارد</span>
              <span className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                تخت انتخابی در اتاق {studentRoom.roomNumber} برای شما به صورت موقت رزرو شده است. پس از بررسی و تأیید نهایی توسط سرپرستی سرا یا مدیریت کل سامانه، اسکان شما به صورت قطعی ثبت خواهد شد.
              </span>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-extrabold text-[11px] shrink-0 border border-amber-300 dark:border-amber-700">
            در انتظار تأیید سرپرست / مدیر
          </span>
        </div>
      )}

      {/* دکمه‌های ناوبری اصلی داشبورد دانشجو */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'overview'
              ? 'bg-teal-600 text-white shadow-teal-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>مشاهده اتاق و مشخصات هم‌اتاقی‌ها</span>
        </button>

        <button
          onClick={() => {
            if (!student.isProfileCompleted) {
              setIsProfileModalOpen(true);
              return;
            }
            setActiveTab('picker');
          }}
          className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'picker'
              ? 'bg-teal-600 text-white shadow-teal-600/20'
              : !student.isProfileCompleted
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-2 border-dashed border-amber-400'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          {!student.isProfileCompleted ? (
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-500" />
          )}
          <span>انتخاب یا جابجایی اتاق و تخت بصری</span>
          {!student.isProfileCompleted && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold mr-1 shrink-0">
              قفل (نیازمند تکمیل پرونده)
            </span>
          )}
        </button>

        <button
          onClick={() => setIsIdCardModalOpen(true)}
          className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-800 hover:to-cyan-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-700/20 hover:scale-105"
        >
          <QrCode className="w-4 h-4 text-amber-300" />
          <span>کارت شناسایی و مجوز اسکان سرا (چاپ / مجازی)</span>
        </button>

        <button
          onClick={onOpenMessages}
          className="py-3.5 px-5 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <MessageSquare className="w-4 h-4 text-teal-600" />
          <span>ارسال پیام به سرپرست سرا و مدیر</span>
        </button>

        <button
          onClick={onOpenMessages}
          className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-700/20"
          title="ارتباط مستقیم و محرمانه با مشاوران و روانشناسان سراهای دانشجویی"
        >
          <HeartHandshake className="w-4 h-4 text-emerald-200" />
          <span>درخواست مشاوره و پیام به مشاور مرکز</span>
        </button>
      </div>

      {/* اطلاعیه‌های دانشگاه و سرا در صفحه اول داشبورد */}
      {announcements.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white mb-4">
            <Bell className="w-5 h-5 text-teal-600" />
            <span>اطلاعیه‌های مهم امور سراهای دانشجویی دانشگاه فرهنگیان</span>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border transition ${
                  ann.priority === 'urgent'
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                    : ann.priority === 'important'
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {ann.priority === 'urgent' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                        فوری و مهم
                      </span>
                    )}
                    {ann.priority === 'important' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
                        اطلاعیه مهم
                      </span>
                    )}
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {ann.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">{ann.date}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ann.content}
                </p>
                {ann.imageUrl && (
                  <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-black/5 max-w-md">
                    <img
                      src={ann.imageUrl}
                      alt={ann.title}
                      className="w-full max-h-48 object-cover rounded-xl"
                    />
                  </div>
                )}
                <div className="text-[10px] text-slate-400 mt-2 font-medium">
                  مرجع صدور: {ann.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* محتوای تب فعال */}
      {activeTab === 'overview' && (
        <RoommatesCard
          student={student}
          dorm={studentDorm}
          room={studentRoom}
          bed={studentBed}
          roommates={roommates}
          roomWarnings={myRoomWarnings}
          onSelectBedClick={() => {
            if (!student.isProfileCompleted) {
              setIsProfileModalOpen(true);
              return;
            }
            setActiveTab('picker');
          }}
          isSelectionActive={settings.selectionActive}
        />
      )}

      {activeTab === 'picker' && (
        !student.isProfileCompleted ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border-2 border-dashed border-rose-300 dark:border-rose-900 text-center space-y-4 shadow-sm animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              انتخاب تخت و اتاق منوط به تکمیل پرونده الکترونیک است
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              دانشجومعلم ارجمند، طبق آیین‌نامه اسکان دانشگاه فرهنگیان تا پیش از ثبت کامل و تأیید اطلاعات هویتی، تماس، نشانی و پرونده سلامت، دسترسی به انتخاب اتاق برای شما مقدور نمی‌باشد.
            </p>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-7 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-teal-600/25 cursor-pointer hover:scale-105"
            >
              تکمیل فرم پرونده اسکان
            </button>
          </div>
        ) : (
          <VisualBedPicker
            student={student}
            dorms={dorms}
            rooms={rooms}
            beds={beds}
            students={students}
            settings={settings}
            onBedSelected={() => {
              onRefreshData();
              setActiveTab('overview');
            }}
          />
        )
      )}

      {/* مدال کارت شناسایی و مجوز اسکان سرا */}
      <DormIdCardModal
        isOpen={isIdCardModalOpen}
        onClose={() => setIsIdCardModalOpen(false)}
        student={student}
        dorm={studentDorm}
        room={studentRoom}
        bed={studentBed}
        settings={settings}
      />

    </div>
  );
};
