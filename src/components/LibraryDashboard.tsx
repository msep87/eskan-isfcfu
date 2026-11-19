import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AppSettings,
  LibraryBook,
  LibraryBookRequest,
  LibraryStaff,
  Message,
  Student,
} from '../types';
import { Storage } from '../utils/storage';
import { GraduationClearanceReviewPanel } from './GraduationClearanceReviewPanel';
import {
  DEFAULT_STUDENT_PAGE_SIZE,
  StudentListPaginationBar,
  getPaginationMeta,
} from './StudentListPaginationBar';
import {
  BookOpen,
  BookMarked,
  Users,
  FileCheck2,
  MessageSquare,
  Plus,
  Upload,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  Edit3,
  Trash2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
  FileSpreadsheet,
  Phone,
} from 'lucide-react';

interface LibraryDashboardProps {
  staff: LibraryStaff;
  students: Student[];
  messages: Message[];
  settings: AppSettings;
  onDataChange: () => void;
  onOpenMessages?: () => void;
}

// نوع محدود و امن برای دانشجو — فقط فیلدهای مجاز کاربر کتابخانه
type SafeLibraryStudent = Pick<
  Student,
  'studentId' | 'fullName' | 'fieldOfStudy' | 'entryTerm' | 'mobile' | 'phone'
>;

export const LibraryDashboard: React.FC<LibraryDashboardProps> = ({
  staff,
  students,
  messages,
  settings,
  onDataChange,
  onOpenMessages,
}) => {
  const [activeTab, setActiveTab] = useState<'loans' | 'catalog' | 'students' | 'clearance' | 'messages'>('loans');
  const [refreshTick, setRefreshTick] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // فیلترهای بخش درخواست‌ها و امانات
  const [loanFilter, setLoanFilter] = useState<'all' | 'pending' | 'approved' | 'returned' | 'rejected'>('all');
  const [loanSearch, setLoanSearch] = useState('');
  const [loanNoteById, setLoanNoteById] = useState<Record<string, string>>({});
  const [loanDueById, setLoanDueById] = useState<Record<string, string>>({});

  // مودال ثبت امانت مستقیم
  const [showDirectLoanModal, setShowDirectLoanModal] = useState(false);
  const [directBookId, setDirectBookId] = useState('');
  const [directStudentQuery, setDirectStudentQuery] = useState('');
  const [directStudentId, setDirectStudentId] = useState('');
  const [directDueDate, setDirectDueDate] = useState('');
  const [directNote, setDirectNote] = useState('');

  // بخش مدیریت کتب
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    code: '',
    title: '',
    author: '',
    isbn: '',
    category: 'علوم تربیتی',
    publisher: '',
    publishYear: '',
    totalCopies: 1,
    shelfLocation: '',
    notes: '',
  });
  const excelInputRef = useRef<HTMLInputElement>(null);

  // بخش فهرست دانشجویان با دسترسی محدود
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFieldFilter, setStudentFieldFilter] = useState('all');
  const [studentTermFilter, setStudentTermFilter] = useState('all');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState<number | 'all'>(DEFAULT_STUDENT_PAGE_SIZE);

  // مودال ارسال پیام سریع (فردی یا گروهی به امانت‌گیرندگان / دانشجویان فیلترشده)
  const [messageModal, setMessageModal] = useState<{
    mode: 'single' | 'borrowers' | 'filtered';
    targetStudent?: SafeLibraryStudent;
    defaultSubject?: string;
    defaultContent?: string;
  } | null>(null);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');

  // پاسخ مستقیم در تب پیام‌ها
  const [replyByMsgId, setReplyByMsgId] = useState<Record<string, string>>({});

  // استخراج صرفاً فیلدهای مجاز دانشجویان (کد دانشجویی، نام و نام خانوادگی، رشته، ورودی، تلفن تماس)
  const safeStudents: SafeLibraryStudent[] = useMemo(
    () =>
      students.map((s) => ({
        studentId: s.studentId,
        fullName: s.fullName,
        fieldOfStudy: s.fieldOfStudy,
        entryTerm: s.entryTerm,
        mobile: s.mobile,
        phone: s.phone,
      })),
    [students]
  );

  const books = useMemo(() => {
    void refreshTick;
    return Storage.getLibraryBooks();
  }, [refreshTick]);

  const bookRequests = useMemo(() => {
    void refreshTick;
    return Storage.getLibraryBookRequests();
  }, [refreshTick]);

  const pendingClearanceCount = useMemo(() => {
    void refreshTick;
    return Storage.getGraduationClearances().filter(
      (c) =>
        c.educationGateStatus === 'approved' &&
        (c.units?.library?.status || 'pending') === 'pending'
    ).length;
  }, [refreshTick]);

  const libraryMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          m.receiverType === 'library' ||
          m.senderRole === 'library' ||
          m.category === 'library'
      ),
    [messages]
  );

  const pendingRequestsCount = bookRequests.filter((r) => r.status === 'pending').length;
  const activeLoansCount = bookRequests.filter((r) => r.status === 'approved').length;
  const totalBookCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const availableBookCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);

  const activeBorrowerStudentIds = useMemo(
    () => new Set(bookRequests.filter((r) => r.status === 'approved').map((r) => r.studentId)),
    [bookRequests]
  );

  const fieldsList = useMemo(() => {
    const s = new Set<string>();
    safeStudents.forEach((st) => st.fieldOfStudy && s.add(st.fieldOfStudy));
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [safeStudents]);

  const termsList = useMemo(() => {
    const s = new Set<string>();
    safeStudents.forEach((st) => st.entryTerm && s.add(st.entryTerm));
    return Array.from(s).sort((a, b) => b.localeCompare(a, 'fa'));
  }, [safeStudents]);

  const bookCategories = useMemo(() => {
    const s = new Set<string>();
    books.forEach((b) => b.category && s.add(b.category));
    return Array.from(s);
  }, [books]);

  const filteredRequests = useMemo(() => {
    const q = loanSearch.trim().toLowerCase();
    return bookRequests.filter((r) => {
      if (loanFilter !== 'all' && r.status !== loanFilter) return false;
      if (!q) return true;
      return [
        r.requestCode,
        r.bookTitle,
        r.bookCode,
        r.bookAuthor,
        r.studentName,
        r.studentId,
        r.studentFieldOfStudy,
        r.studentPhone || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [bookRequests, loanFilter, loanSearch]);

  const filteredBooks = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return books.filter((b) => {
      if (catalogCategory !== 'all' && b.category !== catalogCategory) return false;
      if (!q) return true;
      return [b.code, b.title, b.author, b.isbn || '', b.category, b.publisher || '', b.shelfLocation || '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [books, catalogCategory, catalogSearch]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return safeStudents.filter((st) => {
      if (studentFieldFilter !== 'all' && st.fieldOfStudy !== studentFieldFilter) return false;
      if (studentTermFilter !== 'all' && st.entryTerm !== studentTermFilter) return false;
      if (!q) return true;
      return [st.studentId, st.fullName, st.fieldOfStudy, st.entryTerm, st.mobile || '', st.phone || '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [safeStudents, studentSearch, studentFieldFilter, studentTermFilter]);

  const { startIndex, endIndex } = getPaginationMeta(
    filteredStudents.length,
    studentPage,
    studentPageSize
  );
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const directMatchingStudents = useMemo(() => {
    const q = directStudentQuery.trim().toLowerCase();
    if (!q) return safeStudents.slice(0, 15);
    return safeStudents
      .filter((st) =>
        [st.studentId, st.fullName, st.fieldOfStudy, st.entryTerm].join(' ').toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [safeStudents, directStudentQuery]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const triggerRefresh = () => {
    setRefreshTick((t) => t + 1);
    onDataChange();
  };

  // تایید، رد و عودت کتاب
  const handleApproveRequest = (req: LibraryBookRequest) => {
    const res = Storage.approveLibraryBookRequest(req.id, {
      librarianId: staff.id,
      librarianName: staff.fullName,
      dueDate: loanDueById[req.id] || '',
      librarianNote: loanNoteById[req.id] || '',
    });
    showToast(res.success ? 'success' : 'error', res.message);
    if (res.success) triggerRefresh();
  };

  const handleRejectRequest = (req: LibraryBookRequest) => {
    const reason = (loanNoteById[req.id] || '').trim();
    if (!reason) {
      showToast('error', 'لطفاً علت رد درخواست را در کادر توضیحات وارد کنید.');
      return;
    }
    const res = Storage.rejectLibraryBookRequest(req.id, {
      librarianId: staff.id,
      librarianName: staff.fullName,
      rejectionReason: reason,
    });
    showToast(res.success ? 'success' : 'error', res.message);
    if (res.success) triggerRefresh();
  };

  const handleReturnBook = (req: LibraryBookRequest) => {
    const res = Storage.returnLibraryBook(req.id, {
      librarianName: staff.fullName,
      librarianNote: loanNoteById[req.id] || '',
    });
    showToast(res.success ? 'success' : 'error', res.message);
    if (res.success) triggerRefresh();
  };

  const handleCreateDirectLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSt = safeStudents.find((s) => s.studentId === directStudentId);
    if (!directBookId || !targetSt) {
      showToast('error', 'لطفاً هم کتاب و هم دانشجو را انتخاب کنید.');
      return;
    }
    const res = Storage.createDirectLibraryLoan({
      bookId: directBookId,
      student: targetSt,
      dueDate: directDueDate,
      librarianId: staff.id,
      librarianName: staff.fullName,
      librarianNote: directNote,
    });
    showToast(res.success ? 'success' : 'error', res.message);
    if (res.success) {
      setShowDirectLoanModal(false);
      setDirectBookId('');
      setDirectStudentId('');
      setDirectStudentQuery('');
      setDirectDueDate('');
      setDirectNote('');
      triggerRefresh();
    }
  };

  // ثبت/ویرایش/حذف تکی کتاب
  const openAddBookModal = () => {
    setEditingBook(null);
    setBookForm({
      code: '',
      title: '',
      author: '',
      isbn: '',
      category: 'علوم تربیتی',
      publisher: '',
      publishYear: '',
      totalCopies: 1,
      shelfLocation: '',
      notes: '',
    });
    setShowBookModal(true);
  };

  const openEditBookModal = (book: LibraryBook) => {
    setEditingBook(book);
    setBookForm({
      code: book.code,
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category,
      publisher: book.publisher || '',
      publishYear: book.publishYear || '',
      totalCopies: book.totalCopies,
      shelfLocation: book.shelfLocation || '',
      notes: book.notes || '',
    });
    setShowBookModal(true);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim()) {
      showToast('error', 'عنوان کتاب الزامی است.');
      return;
    }
    if (editingBook) {
      const res = Storage.updateLibraryBook(editingBook.id, {
        ...bookForm,
        totalCopies: Number(bookForm.totalCopies) || 1,
      });
      showToast(res.success ? 'success' : 'error', res.message);
      if (res.success) {
        setShowBookModal(false);
        triggerRefresh();
      }
    } else {
      const res = Storage.addLibraryBook({
        ...bookForm,
        totalCopies: Number(bookForm.totalCopies) || 1,
        availableCopies: Number(bookForm.totalCopies) || 1,
      });
      showToast(res.success ? 'success' : 'error', res.message);
      if (res.success) {
        setShowBookModal(false);
        triggerRefresh();
      }
    }
  };

  const handleDeleteBook = (book: LibraryBook) => {
    const res = Storage.deleteLibraryBook(book.id);
    showToast(res.success ? 'success' : 'error', res.message);
    if (res.success) triggerRefresh();
  };

  // دانلود فایل نمونه اکسل کتب
  const handleDownloadBookTemplate = () => {
    const sampleRows = [
      {
        'کد کتاب': 'BK-201',
        'عنوان کتاب': 'اصول آموزش و پرورش',
        'نویسنده': 'دکتر علی شریعتمداری',
        'شابک': '978-964-123456-7',
        'موضوع': 'علوم تربیتی',
        'ناشر': 'سمت',
        'سال انتشار': '1402',
        'تعداد نسخه': 5,
        'محل قفسه': 'قفسه الف-۴',
        'توضیحات': 'منبع اصلی درس',
      },
      {
        'کد کتاب': 'BK-202',
        'عنوان کتاب': 'روش تحقیق در علوم رفتاری',
        'نویسنده': 'زهره سرمد و همکاران',
        'شابک': '978-964-654321-0',
        'موضوع': 'پژوهش',
        'ناشر': 'آگاه',
        'سال انتشار': '1403',
        'تعداد نسخه': 4,
        'محل قفسه': 'قفسه پ-۱',
        'توضیحات': 'مرجع پایان‌نامه',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'فهرست_کتب');
    XLSX.writeFile(wb, 'sample-library-books-template.xlsx');
    showToast('success', 'فایل نمونه اکسل فهرست کتب دانلود شد.');
  };

  // خروجی اکسل از کتب موجود
  const handleExportBooksExcel = () => {
    const rows = books.map((b) => ({
      'کد کتاب': b.code,
      'عنوان کتاب': b.title,
      'نویسنده': b.author,
      'شابک': b.isbn || '',
      'موضوع': b.category,
      'ناشر': b.publisher || '',
      'سال انتشار': b.publishYear || '',
      'کل نسخه‌ها': b.totalCopies,
      'نسخه‌های آزاد': b.availableCopies,
      'محل قفسه': b.shelfLocation || '',
      'توضیحات': b.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'کتب_کتابخانه');
    XLSX.writeFile(wb, `library-catalog-${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('success', 'خروجی اکسل فهرست کتب کتابخانه دریافت شد.');
  };

  // ورود گروهی اکسل کتب
  const handleExcelBooksUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

      const pickVal = (obj: Record<string, unknown>, keys: string[]): string => {
        for (const k of keys) {
          if (obj[k] !== undefined && String(obj[k]).trim() !== '') return String(obj[k]).trim();
        }
        const normalizedEntries = Object.entries(obj).map(([k, v]) => [k.replace(/\s+/g, '').toLowerCase(), v] as const);
        for (const k of keys) {
          const nk = k.replace(/\s+/g, '').toLowerCase();
          const hit = normalizedEntries.find(([ek]) => ek === nk || ek.includes(nk));
          if (hit && String(hit[1]).trim() !== '') return String(hit[1]).trim();
        }
        return '';
      };

      const parsedRows = rawRows
        .map((row) => {
          const title = pickVal(row, ['عنوان کتاب', 'عنوان', 'نام کتاب', 'title', 'book_title']);
          if (!title) return null;
          const copiesRaw = pickVal(row, ['تعداد نسخه', 'کل نسخه‌ها', 'تعداد', 'نسخه', 'totalCopies', 'copies']);
          return {
            code: pickVal(row, ['کد کتاب', 'کد', 'شماره کتاب', 'code']),
            title,
            author: pickVal(row, ['نویسنده', 'پدیدآور', 'مولف', 'مؤلف', 'author']),
            isbn: pickVal(row, ['شابک', 'isbn']),
            category: pickVal(row, ['موضوع', 'دسته‌بندی', 'دسته بندی', 'گروه', 'category']),
            publisher: pickVal(row, ['ناشر', 'انتشارات', 'publisher']),
            publishYear: pickVal(row, ['سال انتشار', 'سال', 'publishYear', 'year']),
            totalCopies: Math.max(1, parseInt(copiesRaw.replace(/[^\d]/g, ''), 10) || 1),
            shelfLocation: pickVal(row, ['محل قفسه', 'قفسه', 'مکان', 'shelfLocation', 'shelf']),
            notes: pickVal(row, ['توضیحات', 'یادداشت', 'notes']),
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (parsedRows.length === 0) {
        showToast('error', 'هیچ ردیف معتبری با ستون «عنوان کتاب» در فایل اکسل یافت نشد.');
      } else {
        const res = Storage.bulkImportLibraryBooks(parsedRows);
        showToast(res.success ? 'success' : 'error', res.message);
        if (res.success) triggerRefresh();
      }
    } catch {
      showToast('error', 'خطا در خواندن فایل اکسل. لطفاً از فایل با فرمت xlsx یا xls استفاده کنید.');
    } finally {
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  // باز کردن مودال پیام‌رسانی
  const openMessageModal = (
    mode: 'single' | 'borrowers' | 'filtered',
    targetStudent?: SafeLibraryStudent,
    defaultSubject = '',
    defaultContent = ''
  ) => {
    setMessageModal({ mode, targetStudent, defaultSubject, defaultContent });
    setMsgSubject(defaultSubject);
    setMsgContent(defaultContent);
  };

  const handleSendLibraryMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageModal || !msgSubject.trim() || !msgContent.trim()) {
      showToast('error', 'لطفاً موضوع و متن پیام را تکمیل نمایید.');
      return;
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    let targets: SafeLibraryStudent[] = [];
    if (messageModal.mode === 'single' && messageModal.targetStudent) {
      targets = [messageModal.targetStudent];
    } else if (messageModal.mode === 'borrowers') {
      targets = safeStudents.filter((s) => activeBorrowerStudentIds.has(s.studentId));
    } else if (messageModal.mode === 'filtered') {
      targets = filteredStudents;
    }

    if (targets.length === 0) {
      showToast('error', 'هیچ دانشجویی برای ارسال پیام یافت نشد.');
      return;
    }

    targets.forEach((st) => {
      Storage.addMessage({
        senderId: staff.id,
        senderName: `${staff.fullName} (کتابخانه و پژوهش)`,
        senderRole: 'library',
        receiverType: 'student',
        receiverId: st.studentId,
        receiverName: st.fullName,
        targetScope: 'single',
        category: 'library',
        subject: msgSubject.trim(),
        content: msgContent.trim(),
        date: nowStr,
      });
    });

    showToast(
      'success',
      targets.length === 1
        ? `پیام با موفقیت برای دانشجو «${targets[0].fullName}» ارسال شد.`
        : `پیام کتابخانه با موفقیت برای ${targets.length.toLocaleString('fa-IR')} دانشجو ارسال شد.`
    );
    setMessageModal(null);
    setMsgSubject('');
    setMsgContent('');
    triggerRefresh();
  };

  const handleQuickReplyMessage = (msgId: string) => {
    const text = (replyByMsgId[msgId] || '').trim();
    if (!text) return;
    Storage.replyToMessage(msgId, {
      senderName: `${staff.fullName} (کتابخانه و پژوهش)`,
      senderRole: 'library',
      content: text,
      date: `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    });
    setReplyByMsgId((prev) => ({ ...prev, [msgId]: '' }));
    showToast('success', 'پاسخ شما ارسال شد.');
    triggerRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* سربرگ کارتابل کتابخانه و پژوهش */}
      <div className="rounded-3xl bg-gradient-to-l from-indigo-900 via-indigo-800 to-teal-900 text-white p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-white/15 text-[11px] font-bold text-indigo-100 mb-1">
                کارتابل کتابخانه و پژوهش • سامانه جامع امور دانشجویی
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                خوش آمدید، {staff.fullName}
              </h1>
              <p className="text-xs text-indigo-100/85 mt-1">
                مدیریت مخزن کتب (تکی و اکسل)، تایید درخواست امانت، پیگیری و ارسال پیام به امانت‌گیرندگان و تایید تسویه حساب فارغ‌التحصیلان
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDirectLoanModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت امانت مستقیم کتاب</span>
            </button>
            {activeBorrowerStudentIds.size > 0 && (
              <button
                type="button"
                onClick={() =>
                  openMessageModal(
                    'borrowers',
                    undefined,
                    'یادآوری بازگشت کتب امانی کتابخانه',
                    'دانشجوی گرامی، خواهشمند است نسبت به بررسی موعد بازگشت کتاب امانی خود در کتابخانه دانشگاه اقدام فرمایید.'
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>پیام به همه امانت‌گیرندگان ({activeBorrowerStudentIds.size.toLocaleString('fa-IR')})</span>
              </button>
            )}
          </div>
        </div>

        {/* کارت‌های آماری */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="rounded-2xl bg-white/10 border border-white/15 p-3.5">
            <div className="text-xs text-indigo-100/80 font-bold">درخواست‌های در انتظار تایید</div>
            <div className="text-2xl font-black tabular-nums mt-1 text-amber-300">
              {pendingRequestsCount.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-3.5">
            <div className="text-xs text-indigo-100/80 font-bold">کتب در امانت جاری</div>
            <div className="text-2xl font-black tabular-nums mt-1 text-emerald-300">
              {activeLoansCount.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-3.5">
            <div className="text-xs text-indigo-100/80 font-bold">عناوین و نسخه‌های مخزن</div>
            <div className="text-2xl font-black tabular-nums mt-1">
              {books.length.toLocaleString('fa-IR')}{' '}
              <span className="text-xs font-bold text-indigo-200">
                ({availableBookCopies.toLocaleString('fa-IR')}/{totalBookCopies.toLocaleString('fa-IR')} آزاد)
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 p-3.5">
            <div className="text-xs text-indigo-100/80 font-bold">تسویه فارغ‌التحصیلان منتظر</div>
            <div className="text-2xl font-black tabular-nums mt-1 text-sky-200">
              {pendingClearanceCount.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>
      </div>

      {/* نوار اعلان حریم خصوصی */}
      <div className="px-4 py-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <span>
          سطح دسترسی اطلاعات دانشجویی این کارتابل مطابق سیاست محرمانگی، صرفاً شامل{' '}
          <strong>کد دانشجویی، نام و نام خانوادگی، رشته، ورودی و شماره تماس</strong> می‌باشد.
        </span>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* تب‌های اصلی */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'loans', label: 'درخواست‌ها و امانات کتاب', icon: BookMarked, badge: pendingRequestsCount },
          { id: 'catalog', label: 'فهرست و ورود اکسل کتب', icon: BookOpen, badge: books.length },
          { id: 'students', label: 'دانشجویان و ارسال پیام', icon: Users, badge: 0 },
          { id: 'clearance', label: 'تسویه حساب فارغ‌التحصیلان', icon: FileCheck2, badge: pendingClearanceCount },
          { id: 'messages', label: 'پیام‌های کتابخانه', icon: MessageSquare, badge: libraryMessages.filter((m) => m.status === 'pending' && m.receiverType === 'library').length },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {tab.badge.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* تب ۱: درخواست‌ها و امانات کتاب */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={loanSearch}
                onChange={(e) => setLoanSearch(e.target.value)}
                placeholder="جستجو بر اساس عنوان کتاب، کد امانت، نام یا کد دانشجویی..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'همه' },
                  { id: 'pending', label: 'در انتظار تایید' },
                  { id: 'approved', label: 'در امانت جاری' },
                  { id: 'returned', label: 'عودت داده‌شده' },
                  { id: 'rejected', label: 'ردشده' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLoanFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    loanFilter === f.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
              <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                درخواست یا سابقه امانتی در این فیلتر ثبت نشده است.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const targetSafeStudent: SafeLibraryStudent = {
                  studentId: req.studentId,
                  fullName: req.studentName,
                  fieldOfStudy: req.studentFieldOfStudy || '',
                  entryTerm: req.studentEntryTerm || '',
                  mobile: req.studentPhone || '',
                  phone: req.studentPhone || '',
                };

                return (
                  <div
                    key={req.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold" dir="ltr">
                            {req.requestCode}
                          </span>
                          <h3 className="font-black text-sm text-slate-900 dark:text-white">
                            {req.bookTitle}
                          </h3>
                          <span className="text-xs text-slate-500">({req.bookAuthor} • {req.bookCode})</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                          <span>
                            دانشجو: <strong className="text-slate-900 dark:text-white">{req.studentName}</strong>
                          </span>
                          <span>
                            کد دانشجویی: <strong className="font-mono" dir="ltr">{req.studentId}</strong>
                          </span>
                          <span>رشته: <strong>{req.studentFieldOfStudy}</strong></span>
                          <span>ورودی: <strong>{req.studentEntryTerm}</strong></span>
                          {req.studentPhone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <strong className="font-mono" dir="ltr">{req.studentPhone}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>تاریخ ثبت: {req.requestedAt}</span>
                          {req.dueDate && (
                            <span className="font-bold text-indigo-700 dark:text-indigo-300">
                              موعد بازگشت: {req.dueDate}
                            </span>
                          )}
                          {req.returnedAt && (
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">
                              تاریخ عودت: {req.returnedAt}
                            </span>
                          )}
                        </div>

                        {req.requestNote && (
                          <p className="text-xs bg-slate-50 dark:bg-slate-800/70 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">
                            توضیح دانشجو: {req.requestNote}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {req.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" /> در انتظار تایید
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
                            <BookMarked className="w-3.5 h-3.5" /> در امانت دانشجو
                          </span>
                        )}
                        {req.status === 'returned' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> عودت داده شد
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" /> رد شده
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openMessageModal(
                              'single',
                              targetSafeStudent,
                              `پیام کتابخانه درباره کتاب «${req.bookTitle}»`,
                              `دانشجوی گرامی ${req.studentName}، در خصوص کتاب «${req.bookTitle}» (${req.requestCode}) با موعد بازگشت ${req.dueDate || 'تعیین‌شده'}، لطفاً اقدام لازم را انجام دهید.`
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>پیام به دانشجو</span>
                        </button>
                      </div>
                    </div>

                    {/* عملیات روی درخواست در انتظار تایید */}
                    {req.status === 'pending' && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={loanDueById[req.id] || ''}
                          onChange={(e) => setLoanDueById((p) => ({ ...p, [req.id]: e.target.value }))}
                          placeholder="موعد بازگشت (مثلاً ۱۴۰۵/۰۹/۲۵ - اختیاری)"
                          className="sm:w-56 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        />
                        <input
                          type="text"
                          value={loanNoteById[req.id] || ''}
                          onChange={(e) => setLoanNoteById((p) => ({ ...p, [req.id]: e.target.value }))}
                          placeholder="توضیحات کتابخانه (در صورت رد الزامی)..."
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleApproveRequest(req)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تایید و تحویل کتاب</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(req)}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رد درخواست</span>
                        </button>
                      </div>
                    )}

                    {/* عملیات عودت کتاب روی امانت جاری */}
                    {req.status === 'approved' && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={loanNoteById[req.id] || ''}
                          onChange={(e) => setLoanNoteById((p) => ({ ...p, [req.id]: e.target.value }))}
                          placeholder="یادداشت هنگام تحویل گرفتن کتاب (اختیاری)..."
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleReturnBook(req)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>ثبت عودت و بازگشت کتاب</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* تب ۲: فهرست کتب و ورود اکسل */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="جستجوی عنوان کتاب، نویسنده، کد، شابک یا قفسه..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه موضوعات</option>
                {bookCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openAddBookModal}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت تکی کتاب</span>
              </button>

              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelBooksUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>ورود گروهی با فایل اکسل</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadBookTemplate}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>فایل نمونه اکسل</span>
              </button>

              <button
                type="button"
                onClick={handleExportBooksExcel}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>خروجی اکسل</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-extrabold">کد کتاب</th>
                    <th className="px-4 py-3 font-extrabold">عنوان و نویسنده</th>
                    <th className="px-4 py-3 font-extrabold">موضوع</th>
                    <th className="px-4 py-3 font-extrabold">ناشر / سال</th>
                    <th className="px-4 py-3 font-extrabold">قفسه</th>
                    <th className="px-4 py-3 font-extrabold text-center">موجودی آزاد / کل</th>
                    <th className="px-4 py-3 font-extrabold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200" dir="ltr">
                        {book.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-900 dark:text-white">{book.title}</div>
                        <div className="text-[11px] text-slate-500">{book.author}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold">
                          {book.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {book.publisher || '---'} {book.publishYear ? `(${book.publishYear})` : ''}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {book.shelfLocation || '---'}
                      </td>
                      <td className="px-4 py-3 text-center font-black tabular-nums">
                        <span className={book.availableCopies > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                          {book.availableCopies.toLocaleString('fa-IR')}
                        </span>{' '}
                        / {book.totalCopies.toLocaleString('fa-IR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditBookModal(book)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="ویرایش کتاب"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBook(book)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="حذف کتاب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBooks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        کتابی یافت نشد. می‌توانید به‌صورت تکی یا با فایل اکسل کتب موجود را ثبت کنید.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* تب ۳: فهرست دانشجویان با دسترسی محدود و صفحه‌بندی ۵۰تایی */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setStudentPage(1);
                  }}
                  placeholder="جستجو بر اساس نام، شماره دانشجویی، رشته، ورودی یا تلفن..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <select
                value={studentFieldFilter}
                onChange={(e) => {
                  setStudentFieldFilter(e.target.value);
                  setStudentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه رشته‌ها</option>
                {fieldsList.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <select
                value={studentTermFilter}
                onChange={(e) => {
                  setStudentTermFilter(e.target.value);
                  setStudentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه ورودی‌ها</option>
                {termsList.map((t) => (
                  <option key={t} value={t}>
                    ورودی {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={filteredStudents.length === 0}
              onClick={() =>
                openMessageModal(
                  'filtered',
                  undefined,
                  'اطلاعیه کتابخانه و پژوهش دانشگاه',
                  ''
                )
              }
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>پیام گروهی به فیلتر فعلی ({filteredStudents.length.toLocaleString('fa-IR')})</span>
            </button>
          </div>

          <StudentListPaginationBar
            totalItems={filteredStudents.length}
            currentPage={studentPage}
            pageSize={studentPageSize}
            onPageChange={setStudentPage}
            onPageSizeChange={setStudentPageSize}
          />

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-extrabold">کد دانشجویی</th>
                    <th className="px-4 py-3 font-extrabold">نام و نام خانوادگی</th>
                    <th className="px-4 py-3 font-extrabold">رشته تحصیلی</th>
                    <th className="px-4 py-3 font-extrabold">ورودی</th>
                    <th className="px-4 py-3 font-extrabold">شماره تماس</th>
                    <th className="px-4 py-3 font-extrabold text-center">امانت فعال</th>
                    <th className="px-4 py-3 font-extrabold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStudents.map((st) => {
                    const activeCount = bookRequests.filter(
                      (r) => r.studentId === st.studentId && r.status === 'approved'
                    ).length;
                    return (
                      <tr key={st.studentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200" dir="ltr">
                          {st.studentId}
                        </td>
                        <td className="px-4 py-3 font-black text-slate-900 dark:text-white">
                          {st.fullName}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{st.fieldOfStudy}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{st.entryTerm}</td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200" dir="ltr">
                          {st.mobile || st.phone || '---'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {activeCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-black">
                              {activeCount.toLocaleString('fa-IR')} جلد
                            </span>
                          ) : (
                            <span className="text-slate-400">ندارد</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => openMessageModal('single', st)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>ارسال پیام</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* تب ۴: تسویه حساب فارغ‌التحصیلان (با حریم خصوصی محدود) */}
      {activeTab === 'clearance' && (
        <GraduationClearanceReviewPanel
          unitRole="library"
          reviewerId={staff.id}
          reviewerName={staff.fullName}
          settings={settings}
          onDataChange={triggerRefresh}
          restrictStudentPrivacy={true}
        />
      )}

      {/* تب ۵: پیام‌های کتابخانه */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-sm text-slate-900 dark:text-white">
              پیام‌های دریافتی و ارسالی کتابخانه و پژوهش ({libraryMessages.length.toLocaleString('fa-IR')})
            </h2>
            {onOpenMessages && (
              <button
                type="button"
                onClick={onOpenMessages}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>باز کردن پنجره کامل پیام‌رسان</span>
              </button>
            )}
          </div>

          {libraryMessages.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-xs text-slate-500">
              هنوز پیامی برای واحد کتابخانه ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {libraryMessages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">{m.subject}</h4>
                      <p className="text-[11px] text-slate-500">
                        فرستنده: {m.senderName} • گیرنده: {m.receiverName || 'کتابخانه و پژوهش'} • {m.date}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        m.status === 'answered'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}
                    >
                      {m.status === 'answered' ? 'پاسخ داده شده' : 'در انتظار پاسخ'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {m.content}
                  </p>
                  {m.replies.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {m.replies.map((r) => (
                        <div key={r.id} className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs">
                          <span className="font-bold text-indigo-700 dark:text-indigo-300">{r.senderName}: </span>
                          <span className="text-slate-700 dark:text-slate-200">{r.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={replyByMsgId[m.id] || ''}
                      onChange={(e) => setReplyByMsgId((p) => ({ ...p, [m.id]: e.target.value }))}
                      placeholder="پاسخ سریع کتابخانه..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuickReplyMessage(m.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                    >
                      ارسال پاسخ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* مودال افزودن / ویرایش کتاب */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {editingBook ? 'ویرایش مشخصات کتاب' : 'ثبت کتاب جدید در مخزن کتابخانه'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBook} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">عنوان کتاب *</label>
                  <input
                    required
                    value={bookForm.title}
                    onChange={(e) => setBookForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">نویسنده / پدیدآور *</label>
                  <input
                    required
                    value={bookForm.author}
                    onChange={(e) => setBookForm((p) => ({ ...p, author: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">کد کتاب (اختیاری - خودکار)</label>
                  <input
                    value={bookForm.code}
                    onChange={(e) => setBookForm((p) => ({ ...p, code: e.target.value }))}
                    placeholder="BK-105"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">موضوع / دسته‌بندی</label>
                  <input
                    value={bookForm.category}
                    onChange={(e) => setBookForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">شابک (ISBN)</label>
                  <input
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm((p) => ({ ...p, isbn: e.target.value }))}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">تعداد کل نسخه *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={bookForm.totalCopies}
                    onChange={(e) => setBookForm((p) => ({ ...p, totalCopies: Number(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ناشر</label>
                  <input
                    value={bookForm.publisher}
                    onChange={(e) => setBookForm((p) => ({ ...p, publisher: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">سال انتشار</label>
                  <input
                    value={bookForm.publishYear}
                    onChange={(e) => setBookForm((p) => ({ ...p, publishYear: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">محل قفسه</label>
                <input
                  value={bookForm.shelfLocation}
                  onChange={(e) => setBookForm((p) => ({ ...p, shelfLocation: e.target.value }))}
                  placeholder="مثلاً قفسه ب-۲"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">توضیحات</label>
                <textarea
                  rows={2}
                  value={bookForm.notes}
                  onChange={(e) => setBookForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  ذخیره کتاب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ثبت امانت مستقیم */}
      {showDirectLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                ثبت مستقیم امانت کتاب برای دانشجو
              </h3>
              <button
                type="button"
                onClick={() => setShowDirectLoanModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateDirectLoan} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">انتخاب کتاب موجود *</label>
                <select
                  required
                  value={directBookId}
                  onChange={(e) => setDirectBookId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">-- انتخاب کتاب --</option>
                  {books
                    .filter((b) => b.availableCopies > 0)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.author}) — آزاد: {b.availableCopies}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">جستجو و انتخاب دانشجو *</label>
                <input
                  type="text"
                  value={directStudentQuery}
                  onChange={(e) => setDirectStudentQuery(e.target.value)}
                  placeholder="نام یا شماره دانشجویی را تایپ کنید..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-2"
                />
                <select
                  required
                  value={directStudentId}
                  onChange={(e) => setDirectStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">-- انتخاب دانشجو --</option>
                  {directMatchingStudents.map((st) => (
                    <option key={st.studentId} value={st.studentId}>
                      {st.fullName} — {st.studentId} ({st.fieldOfStudy} / {st.entryTerm})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">موعد بازگشت (اختیاری - پیش‌فرض ۱۴ روز)</label>
                <input
                  type="text"
                  value={directDueDate}
                  onChange={(e) => setDirectDueDate(e.target.value)}
                  placeholder="مثلاً ۱۴۰۵/۱۰/۰۵"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">توضیحات</label>
                <input
                  type="text"
                  value={directNote}
                  onChange={(e) => setDirectNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectLoanModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  ثبت امانت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ارسال پیام کتابخانه به دانشجو */}
      {messageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {messageModal.mode === 'single'
                  ? `ارسال پیام به ${messageModal.targetStudent?.fullName}`
                  : messageModal.mode === 'borrowers'
                  ? `ارسال پیام به همه امانت‌گیرندگان (${activeBorrowerStudentIds.size.toLocaleString('fa-IR')} نفر)`
                  : `ارسال پیام گروهی به ${filteredStudents.length.toLocaleString('fa-IR')} دانشجو`}
              </h3>
              <button
                type="button"
                onClick={() => setMessageModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSendLibraryMessage} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">موضوع پیام *</label>
                <input
                  required
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  placeholder="مثلاً یادآوری بازگشت کتاب امانی"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن پیام *</label>
                <textarea
                  required
                  rows={4}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder="متن پیام کتابخانه و پژوهش را بنویسید..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMessageModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال پیام</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
