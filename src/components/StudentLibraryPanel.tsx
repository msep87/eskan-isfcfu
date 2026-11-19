import React, { useMemo, useState } from 'react';
import { Student } from '../types';
import { Storage } from '../utils/storage';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  BookMarked,
  AlertTriangle,
  Send,
  RotateCcw,
} from 'lucide-react';

interface StudentLibraryPanelProps {
  student: Student;
  onDataChange: () => void;
}

export const StudentLibraryPanel: React.FC<StudentLibraryPanelProps> = ({
  student,
  onDataChange,
}) => {
  const [subTab, setSubTab] = useState<'catalog' | 'my_loans'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [requestingBookId, setRequestingBookId] = useState<string | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const books = useMemo(() => {
    void refreshTick;
    return Storage.getLibraryBooks();
  }, [refreshTick]);

  const myRequests = useMemo(() => {
    void refreshTick;
    return Storage.getLibraryBookRequests().filter((r) => r.studentId === student.studentId);
  }, [student.studentId, refreshTick]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((b) => {
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
      if (!q) return true;
      return [b.title, b.author, b.code, b.isbn || '', b.category, b.publisher || '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [books, searchQuery, categoryFilter]);

  const activeLoansCount = myRequests.filter((r) => r.status === 'approved').length;
  const pendingCount = myRequests.filter((r) => r.status === 'pending').length;

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleRequestBook = (bookId: string) => {
    const res = Storage.createLibraryBookRequest({
      bookId,
      student,
      requestNote,
    });
    if (res.success) {
      showToast('success', res.message);
      setRequestingBookId(null);
      setRequestNote('');
      setRefreshTick((t) => t + 1);
      onDataChange();
    } else {
      showToast('error', res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* سربرگ کتابخانه و پژوهش */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                کتابخانه و پژوهش دانشگاه
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                جستجو در فهرست کتب موجود کتابخانه، ثبت درخواست امانت کتاب و پیگیری موعد بازگشت کتب امانی شما.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                subTab === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              فهرست کتب موجود ({books.length.toLocaleString('fa-IR')})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('my_loans')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                subTab === 'my_loans'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>درخواست‌ها و امانات من</span>
              {(activeLoansCount + pendingCount) > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-900 text-[10px] font-black">
                  {(activeLoansCount + pendingCount).toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          </div>
        </div>
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

      {subTab === 'catalog' ? (
        <div className="space-y-4">
          {/* جستجو و فیلتر موضوع */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی عنوان کتاب، نویسنده، کد کتاب یا شابک..."
                className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">همه موضوعات</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">کتابی با این مشخصات یافت نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => {
                const alreadyRequested = myRequests.find(
                  (r) => r.bookId === book.id && (r.status === 'pending' || r.status === 'approved')
                );
                const isAvailable = book.availableCopies > 0;
                const isRequestingThis = requestingBookId === book.id;

                return (
                  <div
                    key={book.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                          {book.category}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400" dir="ltr">
                          {book.code}
                        </span>
                      </div>

                      <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        نویسنده: {book.author}
                      </p>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {book.publisher && <span>ناشر: {book.publisher}</span>}
                        {book.publishYear && <span>سال: {book.publishYear}</span>}
                        {book.shelfLocation && <span>قفسه: {book.shelfLocation}</span>}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">موجودی آزاد:</span>
                        <span
                          className={`font-black tabular-nums ${
                            isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {book.availableCopies.toLocaleString('fa-IR')} از {book.totalCopies.toLocaleString('fa-IR')} نسخه
                        </span>
                      </div>

                      {alreadyRequested ? (
                        <div className="w-full py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold text-center">
                          {alreadyRequested.status === 'approved'
                            ? 'هم‌اکنون در امانت شماست'
                            : 'درخواست شما ثبت و در انتظار تایید است'}
                        </div>
                      ) : isRequestingThis ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={requestNote}
                            onChange={(e) => setRequestNote(e.target.value)}
                            placeholder="یادداشت کوتاه برای مسئول کتابخانه (اختیاری)..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRequestBook(book.id)}
                              className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>ارسال درخواست</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRequestingBookId(null);
                                setRequestNote('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setRequestingBookId(book.id)}
                          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
                        >
                          <BookMarked className="w-3.5 h-3.5" />
                          <span>{isAvailable ? 'ثبت درخواست امانت کتاب' : 'موجودی به اتمام رسیده'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
              <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                هنوز درخواست یا امانت کتابی برای شما ثبت نشده است.
              </p>
            </div>
          ) : (
            myRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" dir="ltr">
                      {req.requestCode}
                    </span>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">{req.bookTitle}</h4>
                    <span className="text-xs text-slate-500">({req.bookAuthor})</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-3">
                    <span>تاریخ درخواست: {req.requestedAt}</span>
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
                  {(req.librarianNote || req.rejectionReason) && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 px-3 py-1.5 rounded-lg mt-1">
                      توضیح کتابخانه: {req.rejectionReason || req.librarianNote}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {req.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" /> در انتظار تایید کتابخانه
                    </span>
                  )}
                  {req.status === 'approved' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
                      <BookMarked className="w-3.5 h-3.5" /> در امانت شما
                    </span>
                  )}
                  {req.status === 'returned' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                      <RotateCcw className="w-3.5 h-3.5" /> تحویل داده‌شده
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-xs font-bold">
                      <XCircle className="w-3.5 h-3.5" /> تایید نشده
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
