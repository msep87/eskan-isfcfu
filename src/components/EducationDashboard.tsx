import React, { useMemo, useState } from 'react';
import { PersianDatePicker } from './PersianDatePicker';
import {
  AcademicNoticeType,
  AcademicStatusNotice,
  AppSettings,
  EducationStaff,
  Message,
  Student,
} from '../types';
import {
  Storage,
  doesEducationStaffCoverField,
  doesEducationStaffMatchMessage,
  getEducationStaffRoleLabel,
  getRelatedEducationColleagues,
  isEducationDepartmentHead,
  normalizeAssignedFieldsList,
  normalizePersianSearch,
} from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import { GraduationClearanceReviewPanel } from './GraduationClearanceReviewPanel';
import { CollapsibleMenuGrid } from './CollapsibleMenuGrid';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  FileWarning,
  GraduationCap,
  Layers,
  Mail,
  MessageSquare,
  Search,
  Send,
  UserCheck,
  Users,
  CornerDownLeft,
  X,
} from 'lucide-react';

interface EducationDashboardProps {
  staff: EducationStaff;
  students: Student[];
  messages: Message[];
  settings: AppSettings;
  cloudSyncTick?: number;
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenUserGuide: (role?: 'education') => void;
}

export const EducationDashboard: React.FC<EducationDashboardProps> = ({
  staff,
  students,
  messages,
  settings,
  cloudSyncTick,
  onRefreshData,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'colleagues' | 'notices' | 'clearance' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // پیام‌رسانی کارشناس آموزش / مدیر گروه آموزشی (فقط پیام‌های مرتبط و غیرمحرمانه)
  const [msgScope, setMsgScope] = useState<'single' | 'field' | 'entry_term' | 'colleague'>('single');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedEntryTerm, setSelectedEntryTerm] = useState<string>('');
  const [selectedColleagueId, setSelectedColleagueId] = useState<string>('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFieldFilter, setRosterFieldFilter] = useState<string>('all');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');

  // صندوق پیام‌های آموزشی
  const [inboxFilter, setInboxFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [inboxSearch, setInboxSearch] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // اعلام وضعیت مرخصی تحصیلی / اخراج به مدیر
  const [noticeStudentQuery, setNoticeStudentQuery] = useState('');
  const [noticeStudentId, setNoticeStudentId] = useState('');
  const [noticeType, setNoticeType] = useState<AcademicNoticeType>('academic_leave');
  const [noticeAcademicYear, setNoticeAcademicYear] = useState(
    settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶'
  );
  const [noticeSemester, setNoticeSemester] = useState(
    settings.currentSemester || 'نیمسال اول'
  );
  const [noticeEffectiveDate, setNoticeEffectiveDate] = useState(
    new Date().toLocaleDateString('fa-IR')
  );
  const [noticeLetterNumber, setNoticeLetterNumber] = useState('');
  const [noticeDescription, setNoticeDescription] = useState('');
  const [noticeListFilter, setNoticeListFilter] = useState<'all' | 'pending' | 'reviewed' | 'action_taken'>('all');

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const isDeptHead = isEducationDepartmentHead(staff);
  const staffRoleLabel = getEducationStaffRoleLabel(staff);
  const assignedFields = useMemo(
    () => normalizeAssignedFieldsList(staff.assignedFields),
    [staff.assignedFields]
  );
  const [onlyMyFields, setOnlyMyFields] = useState<boolean>(true);
  // برای مدیر گروه آموزشی با رشته‌های مشخص، دامنه دانشجویان همیشه به رشته‌های خودش محدود می‌ماند
  const isFieldScoped = assignedFields.length > 0 && (isDeptHead || onlyMyFields);

  const scopedStudents = useMemo(() => {
    if (!isFieldScoped) return students;
    return students.filter((s) => doesEducationStaffCoverField(staff, s.fieldOfStudy));
  }, [students, staff, isFieldScoped]);

  const allEducationStaff = useMemo(
    () => Storage.getEducationStaff(),
    [cloudSyncTick, messages]
  );

  // همکاران مرتبط (برای مدیر گروه: کارشناسان آموزش هم‌رشته؛ برای کارشناس آموزش: مدیران گروه هم‌رشته)
  const relatedColleagues = useMemo(
    () => getRelatedEducationColleagues(staff, allEducationStaff),
    [staff, allEducationStaff]
  );

  const allActiveColleagues = useMemo(
    () =>
      allEducationStaff.filter(
        (e) => e.id !== staff.id && e.status !== 'inactive' && e.isActive !== false
      ),
    [staff.id, allEducationStaff]
  );

  const filteredRosterStudents = useMemo(() => {
    const q = normalizePersianSearch(rosterSearch);
    return scopedStudents.filter((s) => {
      if (
        rosterFieldFilter !== 'all' &&
        normalizePersianSearch(s.fieldOfStudy || '') !== normalizePersianSearch(rosterFieldFilter)
      ) {
        return false;
      }
      if (!q) return true;
      const hay = normalizePersianSearch(
        `${s.fullName} ${s.studentId} ${toEnglishDigits(s.studentId || '')} ${s.fieldOfStudy || ''} ${s.entryTerm || ''}`
      );
      return hay.includes(q);
    });
  }, [scopedStudents, rosterSearch, rosterFieldFilter]);

  // رشته‌ها و ورودی‌های یکتا برای ارسال پیام گروهی
  const uniqueFields = useMemo(() => {
    const set = new Set<string>();
    scopedStudents.forEach((s) => {
      const val = (s.fieldOfStudy || '').trim();
      if (val) set.add(val);
    });
    if (isFieldScoped) {
      assignedFields.forEach((f) => set.add(f));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [scopedStudents, isFieldScoped, assignedFields]);

  const uniqueEntryTerms = useMemo(() => {
    const set = new Set<string>();
    scopedStudents.forEach((s) => {
      const val = (s.entryTerm || '').trim();
      if (val) set.add(val);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a, 'fa'));
  }, [scopedStudents]);

  // جستجوی دانشجو بر اساس نام و نام خانوادگی، رشته تحصیلی، کد دانشجویی یا کد ملی
  const matchStudents = (query: string) => {
    const q = normalizePersianSearch(query);
    if (!q) return scopedStudents.slice(0, 12);
    return scopedStudents
      .filter((s) => {
        const hay = [
          s.fullName,
          s.fieldOfStudy,
          s.studentId,
          toEnglishDigits(s.studentId || ''),
          s.nationalId,
          toEnglishDigits(s.nationalId || ''),
          s.entryTerm,
        ]
          .filter(Boolean)
          .map((item) => normalizePersianSearch(String(item)))
          .join(' ');
        return hay.includes(q);
      })
      .slice(0, 20);
  };

  const searchedComposeStudents = useMemo(
    () => matchStudents(studentSearchQuery),
    [students, studentSearchQuery]
  );

  const selectedComposeStudent = useMemo(
    () => students.find((s) => s.studentId === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const searchedNoticeStudents = useMemo(
    () => matchStudents(noticeStudentQuery),
    [students, noticeStudentQuery]
  );

  const selectedNoticeStudent = useMemo(
    () => students.find((s) => s.studentId === noticeStudentId) || null,
    [students, noticeStudentId]
  );

  const fieldRecipientCount = useMemo(() => {
    if (!selectedField) return 0;
    const normField = normalizePersianSearch(selectedField);
    return students.filter((s) => normalizePersianSearch(s.fieldOfStudy || '') === normField).length;
  }, [students, selectedField]);

  const entryTermRecipientCount = useMemo(() => {
    if (!selectedEntryTerm) return 0;
    const normTerm = normalizePersianSearch(selectedEntryTerm);
    return students.filter((s) => normalizePersianSearch(s.entryTerm || '') === normTerm).length;
  }, [students, selectedEntryTerm]);

  // فیلتر اکید پیام‌ها: پیام‌های مربوط به این کارشناس آموزش بر اساس رشته‌های تحت پوشش (بدون دسترسی به گزارش‌های محرمانه یا رشته‌های سایر کارشناسان)
  const educationMessages = useMemo(() => {
    const allEducationStaff = Storage.getEducationStaff();
    return messages.filter(
      (m) =>
        !m.isConfidential &&
        doesEducationStaffMatchMessage(staff, m, allEducationStaff, students)
    );
  }, [messages, staff, students, cloudSyncTick]);

  const filteredInboxMessages = useMemo(() => {
    const q = normalizePersianSearch(inboxSearch);
    return educationMessages.filter((m) => {
      if (inboxFilter === 'pending' && m.status === 'answered') return false;
      if (inboxFilter === 'answered' && m.status !== 'answered') return false;
      if (!q) return true;
      const hay = normalizePersianSearch(
        `${m.senderName} ${m.senderId} ${m.receiverName || ''} ${m.targetFieldOfStudy || ''} ${
          m.targetEntryTerm || ''
        } ${m.subject} ${m.content}`
      );
      return hay.includes(q);
    });
  }, [educationMessages, inboxFilter, inboxSearch]);

  const selectedMessage = useMemo(
    () => educationMessages.find((m) => m.id === selectedMessageId) || null,
    [educationMessages, selectedMessageId]
  );

  const pendingMessagesCount = useMemo(
    () => educationMessages.filter((m) => m.status !== 'answered').length,
    [educationMessages]
  );

  const academicNotices = useMemo(() => {
    const all = Storage.getAcademicNotices();
    return all.filter((n) => noticeListFilter === 'all' || n.status === noticeListFilter);
  }, [noticeListFilter, messages, students, cloudSyncTick]);

  const pendingNoticesCount = useMemo(
    () => Storage.getAcademicNotices().filter((n) => n.status === 'pending').length,
    [messages, students, cloudSyncTick]
  );

  const pendingClearanceGateCount = useMemo(() => {
    const targetStatus = isDeptHead ? 'pending_dept_head' : 'pending_education';
    const all = Storage.getGraduationClearances().filter((c) => c.status === targetStatus);
    if (assignedFields.length === 0) return all.length;
    return all.filter((c) => doesEducationStaffCoverField(staff, c.studentFieldOfStudy)).length;
  }, [messages, students, cloudSyncTick, assignedFields, staff, isDeptHead]);

  const handleSendEducationMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubject = msgSubject.trim();
    const cleanContent = msgContent.trim();
    if (!cleanSubject || !cleanContent) {
      showToast('error', 'لطفاً موضوع و متن پیام را وارد نمایید.');
      return;
    }

    const nowDate =
      new Date().toLocaleDateString('fa-IR') +
      ' - ' +
      new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    if (msgScope === 'colleague') {
      const targetColleague = allActiveColleagues.find((c) => c.id === selectedColleagueId);
      if (!targetColleague) {
        showToast(
          'error',
          isDeptHead
            ? 'لطفاً کارشناس آموزش یا همکار مورد نظر را انتخاب نمایید.'
            : 'لطفاً مدیر گروه آموزشی یا همکار مورد نظر را انتخاب نمایید.'
        );
        return;
      }
      const targetRoleLabel = getEducationStaffRoleLabel(targetColleague);
      Storage.addMessage({
        senderId: staff.id,
        senderName: `${staff.fullName} (${staffRoleLabel})`,
        senderRole: 'education',
        receiverType: 'education',
        receiverId: targetColleague.id,
        receiverName: `${targetColleague.fullName} (${targetRoleLabel})`,
        targetEducationStaffId: targetColleague.id,
        targetEducationStaffName: targetColleague.fullName,
        category: 'education',
        subject: cleanSubject,
        content: cleanContent,
        isConfidential: false,
        date: nowDate,
      });
      Storage.addActivityLog({
        category: 'education',
        action: `ارسال پیام ${staffRoleLabel} به ${targetRoleLabel}`,
        details: `پیام آموزشی «${cleanSubject}» از طرف ${staff.fullName} (${staffRoleLabel}) به ${targetColleague.fullName} (${targetRoleLabel}) ارسال شد.`,
        targetName: targetColleague.fullName,
        actorName: staff.fullName,
        actorRole: 'education',
        actorUsername: staff.username,
      });
      showToast(
        'success',
        `پیام با موفقیت برای ${targetRoleLabel} «${targetColleague.fullName}» ارسال شد.`
      );
    } else if (msgScope === 'single') {
      if (!selectedComposeStudent) {
        showToast('error', 'لطفاً ابتدا دانشجوی مورد نظر را جستجو و انتخاب نمایید.');
        return;
      }
      Storage.addMessage({
        senderId: staff.id,
        senderName: `${staff.fullName} (${staffRoleLabel})`,
        senderRole: 'education',
        receiverType: 'student',
        receiverId: selectedComposeStudent.studentId,
        receiverName: selectedComposeStudent.fullName,
        targetScope: 'single',
        category: 'education',
        subject: cleanSubject,
        content: cleanContent,
        isConfidential: false,
        date: nowDate,
      });
      Storage.addActivityLog({
        category: 'education',
        action: `ارسال پیام ${staffRoleLabel} به دانشجو`,
        details: `پیام آموزشی با عنوان «${cleanSubject}» به ${selectedComposeStudent.fullName} (${selectedComposeStudent.studentId}) ارسال شد.`,
        targetName: selectedComposeStudent.fullName,
        actorName: staff.fullName,
        actorRole: 'education',
        actorUsername: staff.username,
      });
      showToast('success', `پیام با موفقیت برای «${selectedComposeStudent.fullName}» ارسال شد.`);
    } else if (msgScope === 'field') {
      if (!selectedField) {
        showToast('error', 'لطفاً رشته تحصیلی هدف را انتخاب نمایید.');
        return;
      }
      Storage.addMessage({
        senderId: staff.id,
        senderName: `${staff.fullName} (${staffRoleLabel})`,
        senderRole: 'education',
        receiverType: 'student',
        targetScope: 'field',
        targetFieldOfStudy: selectedField,
        recipientCount: fieldRecipientCount,
        receiverName: `کل دانشجویان رشته ${selectedField}`,
        category: 'education',
        subject: cleanSubject,
        content: cleanContent,
        isConfidential: false,
        date: nowDate,
      });
      Storage.addActivityLog({
        category: 'education',
        action: `ارسال پیام گروهی رشته توسط ${staffRoleLabel}`,
        details: `پیام آموزشی «${cleanSubject}» برای کل دانشجویان رشته «${selectedField}» (${fieldRecipientCount} نفر) ارسال شد.`,
        targetName: `رشته ${selectedField}`,
        actorName: staff.fullName,
        actorRole: 'education',
        actorUsername: staff.username,
      });
      showToast('success', `پیام گروهی برای ${fieldRecipientCount} دانشجوی رشته «${selectedField}» ارسال شد.`);
    } else {
      if (!selectedEntryTerm) {
        showToast('error', 'لطفاً سال / ترم ورودی هدف را انتخاب نمایید.');
        return;
      }
      Storage.addMessage({
        senderId: staff.id,
        senderName: `${staff.fullName} (${staffRoleLabel})`,
        senderRole: 'education',
        receiverType: 'student',
        targetScope: 'entry_term',
        targetEntryTerm: selectedEntryTerm,
        recipientCount: entryTermRecipientCount,
        receiverName: `کل دانشجویان ورودی ${selectedEntryTerm}`,
        category: 'education',
        subject: cleanSubject,
        content: cleanContent,
        isConfidential: false,
        date: nowDate,
      });
      Storage.addActivityLog({
        category: 'education',
        action: `ارسال پیام گروهی ورودی توسط ${staffRoleLabel}`,
        details: `پیام آموزشی «${cleanSubject}» برای کل دانشجویان ورودی «${selectedEntryTerm}» (${entryTermRecipientCount} نفر) ارسال شد.`,
        targetName: `ورودی ${selectedEntryTerm}`,
        actorName: staff.fullName,
        actorRole: 'education',
        actorUsername: staff.username,
      });
      showToast('success', `پیام گروهی برای ${entryTermRecipientCount} دانشجوی ورودی «${selectedEntryTerm}» ارسال شد.`);
    }

    setMsgSubject('');
    setMsgContent('');
    onRefreshData();
  };

  const handleReplySubmit = (messageId: string) => {
    if (!replyText.trim()) return;
    Storage.replyToMessage(messageId, {
      senderName: `${staff.fullName} (${staffRoleLabel})`,
      senderRole: 'education',
      content: replyText.trim(),
      date:
        new Date().toLocaleDateString('fa-IR') +
        ' - ' +
        new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    });
    setReplyText('');
    onRefreshData();
    showToast('success', 'پاسخ شما ثبت و ارسال گردید.');
  };

  const handleSubmitAcademicNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNoticeStudent) {
      showToast('error', 'لطفاً ابتدا دانشجوی مورد نظر را جستجو و انتخاب نمایید.');
      return;
    }
    if (!noticeDescription.trim()) {
      showToast('error', 'لطفاً شرح علت یا جزئیات مرخصی تحصیلی / اخراج را وارد کنید.');
      return;
    }

    const added = Storage.addAcademicNotice({
      student: selectedNoticeStudent,
      noticeType,
      academicYear: noticeAcademicYear.trim() || settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶',
      semester: noticeSemester.trim() || settings.currentSemester || 'نیمسال اول',
      effectiveDate: noticeEffectiveDate.trim() || new Date().toLocaleDateString('fa-IR'),
      letterNumber: noticeLetterNumber.trim() || undefined,
      description: noticeDescription.trim(),
      reportedByStaffId: staff.id,
      reportedByStaffName: staff.fullName,
    });

    if (!added.success) {
      showToast('error', added.message);
      return;
    }

    setNoticeLetterNumber('');
    setNoticeDescription('');
    setNoticeStudentId('');
    setNoticeStudentQuery('');
    onRefreshData();
    showToast(
      'success',
      `اعلامیه وضعیت تحصیلی با کد پیگیری ${added.notice?.noticeCode || ''} با موفقیت به کارتابل مدیر سامانه ارسال شد.`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* سربرگ کارتابل اختصاصی کارشناس آموزش */}
      <div className="bg-gradient-to-l from-sky-900 via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-sky-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {staff.photoUrl ? (
              <img
                src={staff.photoUrl}
                alt={staff.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-300 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                <GraduationCap className="w-8 h-8 text-sky-200" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black">
                  کارتابل {staffRoleLabel} • {staff.fullName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isDeptHead
                      ? 'bg-amber-400/20 border-amber-300/50 text-amber-100'
                      : 'bg-sky-500/25 border-sky-300/40 text-sky-100'
                  }`}
                >
                  {isDeptHead
                    ? 'مدیریت گروه آموزشی و ارتباط با کارشناسان و دانشجویان'
                    : 'ارتباط آموزشی و اعلام وضعیت تحصیلی'}
                </span>
              </div>
              <p className="text-xs text-sky-100/80 mt-1 leading-relaxed">
                {staff.department || (isDeptHead ? 'گروه آموزشی دانشگاه فرهنگیان' : 'واحد امور آموزشی دانشگاه فرهنگیان')} •{' '}
                {isDeptHead
                  ? 'ارتباط مستقیم با کارشناسان آموزش و دانشجویان رشته‌های تحت مدیریت گروه، ارسال پیام تکی و گروهی و پیگیری امور آموزشی'
                  : 'پاسخ‌گویی به پیام‌های آموزشی دانشجویان، هماهنگی با مدیران گروه، ارسال پیام تکی یا گروهی و اعلام مرخصی یا اخراج'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] font-bold text-sky-200">
                  {isDeptHead ? 'رشته‌های تحت مدیریت گروه:' : 'رشته‌های تحت پوشش:'}
                </span>
                {assignedFields.length > 0 ? (
                  <>
                    {assignedFields.map((field) => (
                      <span
                        key={field}
                        className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 text-[11px] font-extrabold"
                      >
                        {field}
                      </span>
                    ))}
                    {!isDeptHead && (
                      <button
                        type="button"
                        onClick={() => setOnlyMyFields((prev) => !prev)}
                        className="mr-1 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[10px] font-bold transition cursor-pointer"
                      >
                        {onlyMyFields ? 'فیلتر فعال: فقط رشته‌های من (نمایش همه)' : 'نمایش همه رشته‌ها (محدود به رشته‌های من)'}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-sky-100 text-[11px] font-bold">
                    {isDeptHead ? 'همه رشته‌های تحصیلی (مدیر گروه عمومی)' : 'همه رشته‌های تحصیلی (کارشناس عمومی)'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenMessages}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-sky-200" />
              <span>پنجره کامل پیام‌ها ({pendingMessagesCount} در انتظار)</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenUserGuide('education')}
              className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              <span>راهنمای کاربری</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/15 text-xs">
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <div className="text-sky-200 text-[11px]">پیام‌های آموزشی در انتظار پاسخ</div>
            <div className="text-xl font-black mt-0.5">{pendingMessagesCount.toLocaleString('fa-IR')}</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <div className="text-sky-200 text-[11px]">کل گفتگوهای آموزشی ثبت‌شده</div>
            <div className="text-xl font-black mt-0.5">{educationMessages.length.toLocaleString('fa-IR')}</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-sky-200 text-[11px]">اعلامیه‌های ارسالی به مدیر (در انتظار بررسی)</div>
            <div className="text-xl font-black mt-0.5">{pendingNoticesCount.toLocaleString('fa-IR')}</div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* منوی بازشونده بخش‌های حوزه آموزش */}
      <CollapsibleMenuGrid<'messages' | 'colleagues' | 'notices' | 'clearance'>
        activeKey={activeTab}
        onToggle={(key) => setActiveTab((prev) => (prev === key ? null : key))}
        onCloseActive={() => setActiveTab(null)}
        title={`منوی بخش‌های ${staffRoleLabel} (برای باز یا بسته شدن کلیک کنید)`}
        emptyPrompt="برای مشاهده هر بخش، روی دکمه مربوطه کلیک کنید. با کلیک مجدد همان بخش بسته می‌شود."
        items={[
          {
            id: 'messages',
            label: 'پیام‌ها و ارتباط مستقیم',
            subtitle: isDeptHead
              ? 'مکاتبه با دانشجویان رشته‌های گروه و کارشناسان آموزش'
              : 'مکاتبه با دانشجویان، رشته/ورودی و مدیران گروه',
            icon: <Mail className="w-4 h-4" />,
            badge: pendingMessagesCount,
            badgeTone: 'amber',
            activeClass: 'bg-sky-700 text-white border-sky-700 shadow-md',
          },
          {
            id: 'colleagues',
            label: isDeptHead ? 'کارشناسان و دانشجویان گروه' : 'مدیران گروه و دانشجویان رشته',
            subtitle: isDeptHead
              ? `مشاهده ${relatedColleagues.length.toLocaleString('fa-IR')} کارشناس و ${scopedStudents.length.toLocaleString('fa-IR')} دانشجوی رشته‌های شما`
              : `مشاهده ${relatedColleagues.length.toLocaleString('fa-IR')} مدیر گروه و ${scopedStudents.length.toLocaleString('fa-IR')} دانشجو`,
            icon: <Users className="w-4 h-4" />,
            badge: relatedColleagues.length,
            badgeTone: 'teal',
            activeClass: 'bg-indigo-700 text-white border-indigo-700 shadow-md',
          },
          {
            id: 'notices',
            label: 'اعلام مرخصی تحصیلی یا اخراج',
            subtitle: 'ارسال گزارش رسمی وضعیت تحصیلی به مدیر',
            icon: <FileWarning className="w-4 h-4" />,
            activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md',
          },
          {
            id: 'clearance',
            label: isDeptHead
              ? 'تسویه حساب فارغ‌التحصیلان (دروازه دوم — گزارش ۱۰۵۰)'
              : 'تسویه حساب فارغ‌التحصیلان (دروازه اول — آموزش)',
            subtitle: isDeptHead
              ? 'تأیید گذراندن واحدهای سرفصل طبق گزارش ۱۰۵۰ گلستان'
              : 'بررسی اولیه و ارجاع به مدیر گروه رشته',
            icon: <GraduationCap className="w-4 h-4" />,
            badge: pendingClearanceGateCount,
            badgeTone: 'rose',
            activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md',
          },
        ]}
      />

      {/* بخش ۱: پیام‌رسانی آموزشی (تکی، رشته، ورودی، همکار آموزشی + صندوق پیام‌های آموزشی) */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* فرم ارسال پیام جدید به دانشجو / رشته / ورودی / همکار آموزشی */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  ارسال پیام آموزشی جدید
                </h2>
                <p className="text-[11px] text-slate-400">
                  {isDeptHead
                    ? 'ارسال به دانشجوی رشته‌های گروه، کل رشته، ورودی یا کارشناس آموزش'
                    : 'ارسال به دانشجو، کل رشته، ورودی یا مدیر گروه آموزشی'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setMsgScope('single')}
                className={`py-2 px-1.5 rounded-lg transition cursor-pointer ${
                  msgScope === 'single'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                دانشجوی خاص
              </button>
              <button
                type="button"
                onClick={() => setMsgScope('field')}
                className={`py-2 px-1.5 rounded-lg transition cursor-pointer ${
                  msgScope === 'field'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                کل یک رشته
              </button>
              <button
                type="button"
                onClick={() => setMsgScope('entry_term')}
                className={`py-2 px-1.5 rounded-lg transition cursor-pointer ${
                  msgScope === 'entry_term'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                کل یک ورودی
              </button>
              <button
                type="button"
                onClick={() => setMsgScope('colleague')}
                className={`py-2 px-1.5 rounded-lg transition cursor-pointer ${
                  msgScope === 'colleague'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {isDeptHead ? 'کارشناس آموزش' : 'مدیر گروه'}
              </button>
            </div>

            <form onSubmit={handleSendEducationMessage} className="space-y-3.5 text-xs">
              {msgScope === 'single' && (
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    جستجوی دانشجو (نام و نام خانوادگی، رشته، کد دانشجویی یا کد ملی) *
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="نام، رشته، کد دانشجویی یا کد ملی..."
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {selectedComposeStudent ? (
                    <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-sky-900 dark:text-sky-200">
                          {selectedComposeStudent.fullName}
                        </div>
                        <div className="text-[11px] text-sky-700 dark:text-sky-400">
                          کد: {selectedComposeStudent.studentId} • {selectedComposeStudent.fieldOfStudy} • ورودی{' '}
                          {selectedComposeStudent.entryTerm}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId('')}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-rose-600 text-[11px] font-bold border border-rose-200 cursor-pointer"
                      >
                        تغییر
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                      {searchedComposeStudents.length === 0 ? (
                        <div className="p-3 text-center text-slate-400">
                          دانشجویی با این مشخصات یافت نشد.
                        </div>
                      ) : (
                        searchedComposeStudents.map((st) => (
                          <button
                            key={st.studentId}
                            type="button"
                            onClick={() => setSelectedStudentId(st.studentId)}
                            className="w-full text-right p-2.5 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                {st.fullName}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {st.fieldOfStudy} • ورودی {st.entryTerm}
                              </div>
                            </div>
                            <div className="text-left shrink-0 font-mono text-[10px] text-slate-500">
                              <div>{st.studentId}</div>
                              {st.nationalId && <div>ملی: {st.nationalId}</div>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {msgScope === 'field' && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    انتخاب رشته تحصیلی *
                  </label>
                  <select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="">-- انتخاب رشته تحصیلی --</option>
                    {uniqueFields.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  {selectedField && (
                    <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 pt-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>تعداد دانشجویان مشمول این رشته: {fieldRecipientCount.toLocaleString('fa-IR')} نفر</span>
                    </div>
                  )}
                </div>
              )}

              {msgScope === 'entry_term' && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    انتخاب سال / ترم ورودی *
                  </label>
                  <select
                    value={selectedEntryTerm}
                    onChange={(e) => setSelectedEntryTerm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="">-- انتخاب ورودی دانشجویان --</option>
                    {uniqueEntryTerms.map((term) => (
                      <option key={term} value={term}>
                        ورودی {term}
                      </option>
                    ))}
                  </select>
                  {selectedEntryTerm && (
                    <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 pt-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>تعداد دانشجویان ورودی {selectedEntryTerm}: {entryTermRecipientCount.toLocaleString('fa-IR')} نفر</span>
                    </div>
                  )}
                </div>
              )}

              {msgScope === 'colleague' && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    {isDeptHead
                      ? 'انتخاب کارشناس آموزش یا همکار آموزشی *'
                      : 'انتخاب مدیر گروه آموزشی یا همکار آموزشی *'}
                  </label>
                  <select
                    value={selectedColleagueId}
                    onChange={(e) => setSelectedColleagueId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="">
                      {isDeptHead
                        ? '-- انتخاب کارشناس آموزش / همکار --'
                        : '-- انتخاب مدیر گروه آموزشی / همکار --'}
                    </option>
                    {relatedColleagues.length > 0 && (
                      <optgroup
                        label={
                          isDeptHead
                            ? 'کارشناسان آموزش مرتبط با رشته‌های شما'
                            : 'مدیران گروه آموزشی مرتبط با رشته‌های شما'
                        }
                      >
                        {relatedColleagues.map((c) => {
                          const cFields = normalizeAssignedFieldsList(c.assignedFields);
                          return (
                            <option key={c.id} value={c.id}>
                              {c.fullName} — {getEducationStaffRoleLabel(c)}
                              {cFields.length > 0 ? ` (${cFields.join('، ')})` : ' (همه رشته‌ها)'}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {allActiveColleagues.filter(
                      (c) => !relatedColleagues.some((r) => r.id === c.id)
                    ).length > 0 && (
                      <optgroup label="سایر همکاران حوزه آموزش">
                        {allActiveColleagues
                          .filter((c) => !relatedColleagues.some((r) => r.id === c.id))
                          .map((c) => {
                            const cFields = normalizeAssignedFieldsList(c.assignedFields);
                            return (
                              <option key={c.id} value={c.id}>
                                {c.fullName} — {getEducationStaffRoleLabel(c)}
                                {cFields.length > 0 ? ` (${cFields.join('، ')})` : ' (همه رشته‌ها)'}
                              </option>
                            );
                          })}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  موضوع پیام *
                </label>
                <input
                  type="text"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  placeholder="مثلاً: اطلاعیه انتخاب واحد، زمان تحویل مدارک آموزشی یا پاسخ پرسش شما"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  متن پیام آموزشی *
                </label>
                <textarea
                  rows={4}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder="متن کامل اطلاعیه یا پاسخ آموزشی را بنویسید..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {msgScope === 'single'
                    ? 'ارسال پیام به دانشجو'
                    : msgScope === 'field'
                    ? 'ارسال پیام گروهی به کل رشته'
                    : 'ارسال پیام گروهی به کل ورودی'}
                </span>
              </button>
            </form>
          </div>

          {/* صندوق پیام‌های دریافتی دانشجویان و گفتگوها */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-600" />
                  <span>صندوق پیام‌های کارشناس آموزش</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  شامل سوالات، مشکلات آموزشی دانشجویان و پیام‌های ارسالی کارشناس آموزش
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                {(['all', 'pending', 'answered'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setInboxFilter(f)}
                    className={`px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                      inboxFilter === f
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {f === 'all' ? 'همه' : f === 'pending' ? 'در انتظار پاسخ' : 'پاسخ داده‌شده'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                placeholder="جستجو در پیام‌های آموزشی (نام دانشجو، موضوع، متن، رشته یا ورودی)..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-[340px]">
              <div className="md:col-span-5 space-y-2 max-h-[420px] overflow-y-auto pl-1">
                {filteredInboxMessages.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    پیامی با این فیلتر یافت نشد.
                  </div>
                ) : (
                  filteredInboxMessages.map((msg) => (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => setSelectedMessageId(msg.id)}
                      className={`w-full text-right p-3 rounded-2xl border text-xs transition cursor-pointer ${
                        selectedMessageId === msg.id
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {msg.senderRole === 'education'
                            ? msg.receiverName || 'پیام آموزشی ارسالی'
                            : msg.senderName}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            msg.status === 'answered'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {msg.status === 'answered' ? 'پاسخ داده شد' : 'در انتظار'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300 truncate text-[11px]">
                        {msg.subject}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>
                          {msg.targetScope === 'field'
                            ? `گروهی: ${msg.targetFieldOfStudy}`
                            : msg.targetScope === 'entry_term'
                            ? `ورودی: ${msg.targetEntryTerm}`
                            : msg.senderRole === 'education'
                            ? 'ارسالی به دانشجو'
                            : `کد دانشجویی: ${msg.senderId}`}
                        </span>
                        <span>{msg.date.split('-')[0]}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="md:col-span-7 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/30">
                {selectedMessage ? (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {selectedMessage.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400">{selectedMessage.date}</span>
                        </div>
                        {selectedMessage.receiverName && (
                          <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 mb-1.5">
                            گیرنده: {selectedMessage.receiverName}
                            {selectedMessage.recipientCount
                              ? ` (${selectedMessage.recipientCount.toLocaleString('fa-IR')} نفر)`
                              : ''}
                          </div>
                        )}
                        <h4 className="font-extrabold text-xs text-sky-800 dark:text-sky-300 mb-1">
                          موضوع: {selectedMessage.subject}
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {selectedMessage.content}
                        </p>
                      </div>

                      <div className="space-y-2 max-h-44 overflow-y-auto">
                        {selectedMessage.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 mr-4 text-xs"
                          >
                            <div className="flex items-center justify-between font-bold mb-1 text-sky-900 dark:text-sky-200">
                              <span>{rep.senderName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{rep.date}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {rep.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex gap-2 mt-3">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleReplySubmit(selectedMessage.id);
                          }
                        }}
                        placeholder="پاسخ کارشناس آموزش را بنویسید..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleReplySubmit(selectedMessage.id)}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span>ارسال</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-400 text-center p-6">
                    یک پیام را از ستون سمت راست انتخاب کنید تا متن کامل و پاسخ‌ها نمایش داده شود.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* بخش ۲: اعلام وضعیت مرخصی تحصیلی در ترم یا اخراج دانشجو به مدیر سامانه */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300">
                <FileWarning className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  ثبت و ارسال اعلامیه مرخصی تحصیلی / اخراج به مدیر
                </h2>
                <p className="text-[11px] text-slate-400">
                  این گزارش مستقیماً به کارتابل مدیر سامانه جهت بررسی و تصمیم‌گیری اسکان ارسال می‌شود.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitAcademicNotice} className="space-y-3.5 text-xs">
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  جستجو و انتخاب دانشجو (نام، رشته، کد دانشجویی یا کد ملی) *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={noticeStudentQuery}
                    onChange={(e) => setNoticeStudentQuery(e.target.value)}
                    placeholder="نام، کد دانشجویی، کد ملی یا رشته..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                {selectedNoticeStudent ? (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-rose-900 dark:text-rose-200">
                        {selectedNoticeStudent.fullName}
                      </div>
                      <div className="text-[11px] text-rose-700 dark:text-rose-400">
                        کد: {selectedNoticeStudent.studentId} • {selectedNoticeStudent.fieldOfStudy} • ورودی{' '}
                        {selectedNoticeStudent.entryTerm}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNoticeStudentId('')}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-rose-600 text-[11px] font-bold border border-rose-200 cursor-pointer"
                    >
                      تغییر
                    </button>
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                    {searchedNoticeStudents.length === 0 ? (
                      <div className="p-3 text-center text-slate-400">دانشجویی یافت نشد.</div>
                    ) : (
                      searchedNoticeStudents.map((st) => (
                        <button
                          key={st.studentId}
                          type="button"
                          onClick={() => setNoticeStudentId(st.studentId)}
                          className="w-full text-right p-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100">{st.fullName}</div>
                            <div className="text-[10px] text-slate-500">
                              {st.fieldOfStudy} • ورودی {st.entryTerm}
                            </div>
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">{st.studentId}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع وضعیت تحصیلی *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNoticeType('academic_leave')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      noticeType === 'academic_leave'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    مرخصی تحصیلی در ترم
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoticeType('expulsion')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      noticeType === 'expulsion'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    اخراج / محرومیت از تحصیل
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سال تحصیلی
                  </label>
                  <input
                    type="text"
                    value={noticeAcademicYear}
                    onChange={(e) => setNoticeAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نیمسال تحصیلی
                  </label>
                  <select
                    value={noticeSemester}
                    onChange={(e) => setNoticeSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="نیمسال اول">نیمسال اول (مهر)</option>
                    <option value="نیمسال دوم">نیمسال دوم (بهمن)</option>
                    <option value="ترم تابستان">ترم تابستان</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ اجرا / ابلاغ
                  </label>
                  <PersianDatePicker
                    value={noticeEffectiveDate}
                    onChange={setNoticeEffectiveDate}
                    digits="fa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره نامه / رأی آموزشی
                  </label>
                  <input
                    type="text"
                    value={noticeLetterNumber}
                    onChange={(e) => setNoticeLetterNumber(e.target.value)}
                    placeholder="اختیاری"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شرح وضعیت و مستندات *
                </label>
                <textarea
                  rows={3}
                  value={noticeDescription}
                  onChange={(e) => setNoticeDescription(e.target.value)}
                  placeholder="جزئیات مرخصی تحصیلی ترم یا حکم اخراج دانشجو را برای اطلاع مدیر سامانه درج کنید..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileWarning className="w-4 h-4" />
                <span>ارسال اعلامیه وضعیت به مدیر سامانه</span>
              </button>
            </form>
          </div>

          {/* سابقه اعلامیه‌های ارسال‌شده به مدیر */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-rose-600" />
                  <span>سابقه اعلامیه‌های مرخصی تحصیلی و اخراج</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  پیگیری وضعیت بررسی و اقدام مدیر سامانه بر روی اعلامیه‌های ارسالی
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                {(
                  [
                    { key: 'all', label: 'همه' },
                    { key: 'pending', label: 'در انتظار مدیر' },
                    { key: 'reviewed', label: 'بررسی شده' },
                    { key: 'action_taken', label: 'اقدام انجام شد' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setNoticeListFilter(item.key)}
                    className={`px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                      noticeListFilter === item.key
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {academicNotices.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                هیچ اعلامیه مرخصی تحصیلی یا اخراجی با این فیلتر ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pl-1">
                {academicNotices.map((n: AcademicStatusNotice) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      n.noticeType === 'expulsion'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {n.noticeCode}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                            n.noticeType === 'expulsion'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {n.noticeType === 'expulsion' ? 'اخراج / محرومیت از تحصیل' : 'مرخصی تحصیلی در ترم'}
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {n.studentName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">({n.studentId})</span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                          n.status === 'action_taken'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : n.status === 'reviewed'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>
                          {n.status === 'action_taken'
                            ? 'اقدام انجام شد'
                            : n.status === 'reviewed'
                            ? 'بررسی شده توسط مدیر'
                            : 'در انتظار بررسی مدیر'}
                        </span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap gap-3">
                      <span>رشته: {n.studentFieldOfStudy || '-'}</span>
                      <span>ورودی: {n.studentEntryTerm || '-'}</span>
                      <span>
                        سال/نیمسال: {n.academicYear} ({n.semester})
                      </span>
                      <span>تاریخ اجرا: {n.effectiveDate}</span>
                      {n.letterNumber && <span>شماره نامه: {n.letterNumber}</span>}
                    </div>

                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      {n.description}
                    </p>

                    {n.adminNote && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200">
                        <strong>پاسخ / یادداشت مدیر: </strong>
                        {n.adminNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* بخش جدید: همکاران مرتبط (کارشناسان / مدیران گروه) و دانشجویان رشته‌های تحت پوشش */}
      {activeTab === 'colleagues' && (
        <div className="space-y-6">
          {/* کارت همکاران مرتبط (کارشناسان آموزش برای مدیر گروه / مدیران گروه برای کارشناس) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isDeptHead
                      ? 'کارشناسان آموزش مرتبط با رشته‌های گروه شما'
                      : 'مدیران گروه آموزشی مرتبط با رشته‌های شما'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    امکان ارسال پیام رسمی مستقیم و هماهنگی امور آموزشی رشته‌های مشترک
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold">
                {relatedColleagues.length.toLocaleString('fa-IR')} نفر
              </span>
            </div>

            {relatedColleagues.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                {isDeptHead
                  ? 'هنوز کارشناس آموزشی برای رشته‌های گروه شما ثبت نشده است.'
                  : 'هنوز مدیر گروه آموزشی برای رشته‌های شما تعریف نشده است.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {relatedColleagues.map((col) => {
                  const colFields = normalizeAssignedFieldsList(col.assignedFields);
                  return (
                    <div
                      key={col.id}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        {col.photoUrl ? (
                          <img
                            src={col.photoUrl}
                            alt={col.fullName}
                            className="w-11 h-11 rounded-xl object-cover border border-indigo-200 dark:border-indigo-700 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {(col.fullName || 'آ').slice(0, 1)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {col.fullName}
                          </div>
                          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300 mt-0.5">
                            {getEducationStaffRoleLabel(col)}
                          </div>
                          {(col.mobile || col.phone) && (
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5" dir="ltr">
                              {col.mobile || col.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {colFields.length > 0 ? (
                          colFields.map((f) => (
                            <span
                              key={f}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                            >
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500">
                            همه رشته‌ها
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedColleagueId(col.id);
                          setMsgScope('colleague');
                          setActiveTab('messages');
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ارسال پیام مستقیم</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* فهرست دانشجویان رشته‌های تحت پوشش */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    دانشجویان رشته‌های {isDeptHead ? 'تحت مدیریت گروه شما' : 'تحت پوشش شما'} (
                    {filteredRosterStudents.length.toLocaleString('fa-IR')} نفر)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    جستجو، فیلتر بر اساس رشته و ارسال پیام مستقیم آموزشی به هر دانشجو
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {uniqueFields.length > 1 && (
                  <select
                    value={rosterFieldFilter}
                    onChange={(e) => setRosterFieldFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="all">همه رشته‌های من</option>
                    {uniqueFields.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                )}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="جستجوی نام، کد دانشجویی یا ورودی..."
                    className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-56"
                  />
                </div>
              </div>
            </div>

            {filteredRosterStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                دانشجویی در این فیلتر یافت نشد.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-0.5">
                {filteredRosterStudents.slice(0, 60).map((st) => (
                  <div
                    key={st.studentId}
                    className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {st.fullName}
                      </div>
                      <div className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold truncate">
                        {st.fieldOfStudy || 'رشته نامشخص'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        کد: {st.studentId} • ورودی {st.entryTerm || '-'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(st.studentId);
                        setMsgScope('single');
                        setActiveTab('messages');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition shrink-0 flex items-center gap-1 cursor-pointer"
                      title="ارسال پیام مستقیم به این دانشجو"
                    >
                      <Mail className="w-3 h-3" />
                      <span>پیام</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* بخش ۳: دروازه بررسی تسویه حساب فارغ‌التحصیلان (کارشناس آموزش / مدیر گروه گزارش ۱۰۵۰) */}
      {activeTab === 'clearance' && (
        <GraduationClearanceReviewPanel
          unitRole="education"
          educationSubRole={isDeptHead ? 'department_head' : 'expert'}
          reviewerId={staff.id}
          reviewerName={staff.fullName}
          settings={settings}
          onDataChange={onRefreshData}
          allowedFields={isFieldScoped ? assignedFields : undefined}
        />
      )}
    </div>
  );
};
