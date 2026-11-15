import React, { useMemo, useState } from 'react';
import { GuestRequest } from '../types';
import { Storage } from '../utils/storage';
import { exportGuestRequestsToExcel, toEnglishDigits } from '../utils/excelUtils';
import {
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  FileCheck2,
  ShieldCheck,
  UtensilsCrossed,
  Users,
  X,
  AlertTriangle,
} from 'lucide-react';

interface SupervisorGuestRequestsPanelProps {
  activeDormIds: string[];
  actorName: string;
  onDataChanged: () => void;
}

export const SupervisorGuestRequestsPanel: React.FC<SupervisorGuestRequestsPanelProps> = ({
  activeDormIds,
  actorName,
  onDataChanged,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | GuestRequest['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const [approveTarget, setApproveTarget] = useState<GuestRequest | null>(null);
  const [approveNotes, setApproveNotes] = useState(
    'با درخواست مهمان موافقت شد. لطفاً جهت تکمیل پذیرش، مدارک شناسایی/دانشجویی را به دفتر سرپرستی تحویل دهید.'
  );

  const [rejectTarget, setRejectTarget] = useState<GuestRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const allRequests = Storage.getGuestRequests();

  const scopedRequests = useMemo(() => {
    return allRequests.filter((r) => activeDormIds.length === 0 || activeDormIds.includes(r.dormId));
  }, [allRequests, activeDormIds]);

  const filteredRequests = useMemo(() => {
    const q = toEnglishDigits(searchQuery.trim().toLowerCase());
    return scopedRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (q) {
        const hay = toEnglishDigits(
          `${r.trackingCode} ${r.studentName} ${r.studentId} ${r.studentNationalId} ${r.guestFullName} ${r.guestNationalId} ${r.guestProvince} ${r.guestCity} ${r.dormName} ${r.roomNumber}`
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scopedRequests, statusFilter, searchQuery]);

  const pendingCount = scopedRequests.filter((r) => r.status === 'pending_supervisor').length;
  const approvedCount = scopedRequests.filter((r) => r.status === 'approved').length;
  const awaitingDocsCount = scopedRequests.filter(
    (r) => r.status === 'approved' && !r.documentsSubmittedToSupervisor
  ).length;

  const showNotice = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConfirmApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveTarget) return;
    const res = Storage.approveGuestRequest(approveTarget.id, actorName, approveNotes);
    setApproveTarget(null);
    showNotice(res.message);
    onDataChanged();
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    const res = Storage.rejectGuestRequest(rejectTarget.id, actorName, rejectReason);
    if (!res.success) {
      showNotice(res.message);
      return;
    }
    setRejectTarget(null);
    setRejectReason('');
    showNotice(res.message);
    onDataChanged();
  };

  const handleToggleDocsSubmitted = (req: GuestRequest) => {
    const nextState = !req.documentsSubmittedToSupervisor;
    const res = Storage.markGuestDocumentsSubmitted(req.id, actorName, nextState);
    showNotice(res.message);
    onDataChanged();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* کارت‌های خلاصه آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500">کل درخواست‌های مهمان</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {scopedRequests.length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600">در انتظار بررسی سرپرست</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600">موافقت شده</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-600">منتظر تحویل مدارک در سرپرستی</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{awaitingDocsCount}</div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* پنل جستجو و فیلتر */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                بررسی و موافقت با درخواست‌های مهمان دانشجویان
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                بررسی مشخصات مهمان، احراز اقوام درجه یک یا دانشجوی فرهنگیان استان دیگر، تأیید تعهدات و ثبت تحویل مدارک در سرپرستی
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => exportGuestRequestsToExcel(filteredRequests)}
            disabled={filteredRequests.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>خروجی اکسل ({filteredRequests.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو با کد رهگیری، نام دانشجو، کد دانشجویی، نام مهمان، کد ملی یا اتاق..."
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
          >
            <option value="all">همه وضعیت‌ها ({scopedRequests.length})</option>
            <option value="pending_supervisor">در انتظار بررسی ({pendingCount})</option>
            <option value="approved">موافقت شده ({approvedCount})</option>
            <option value="rejected">رد شده</option>
            <option value="cancelled">لغو شده</option>
          </select>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            هیچ درخواست مهمانی با فیلترهای انتخاب‌شده یافت نشد.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className={`p-4 sm:p-5 rounded-2xl border space-y-3 text-xs ${
                  req.status === 'pending_supervisor'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : req.status === 'approved'
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : req.status === 'rejected'
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-[11px]">
                      {req.trackingCode}
                    </span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      مهمان: {req.guestFullName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">
                      نسبت: {req.relationshipToStudent}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 font-bold">
                      {req.eligibilityType === 'first_degree_relative'
                        ? 'اقوام درجه یک دانشجو'
                        : 'دانشجوی فرهنگیان استان دیگر'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {req.status === 'pending_supervisor' && (
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-extrabold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>در انتظار بررسی</span>
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>موافقت شده</span>
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold inline-flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رد شده</span>
                      </span>
                    )}
                    {req.status === 'cancelled' && (
                      <span className="px-3 py-1 rounded-full bg-slate-300 text-slate-800 font-bold">
                        لغو شده
                      </span>
                    )}
                  </div>
                </div>

                {/* مشخصات دانشجو میزبان و مهمان */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 space-y-1">
                    <div className="font-extrabold text-teal-700 dark:text-teal-300">
                      مشخصات دانشجوی میزبان:
                    </div>
                    <div>
                      <strong>نام و کد دانشجویی:</strong> {req.studentName} (<span className="font-mono">{req.studentId}</span>)
                    </div>
                    <div>
                      <strong>سرا و اتاق:</strong> {req.dormName} — اتاق {req.roomNumber}
                    </div>
                    <div>
                      <strong>تلفن تماس دانشجو:</strong> <span className="font-mono">{req.studentPhone}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 space-y-1">
                    <div className="font-extrabold text-indigo-700 dark:text-indigo-300">
                      مشخصات کامل مهمان و زمان اقامت:
                    </div>
                    <div>
                      <strong>کد ملی / نام پدر / همراه:</strong>{' '}
                      <span className="font-mono">{req.guestNationalId}</span> • {req.guestFatherName} •{' '}
                      <span className="font-mono">{req.guestPhone}</span>
                    </div>
                    <div>
                      <strong>مبدأ:</strong> استان {req.guestProvince} — شهر {req.guestCity}
                    </div>
                    {req.eligibilityType === 'other_province_farhangian' && (
                      <div>
                        <strong>دانشگاه مبدأ مهمان:</strong> {req.guestUniversityName} (کد:{' '}
                        <span className="font-mono">{req.guestStudentId}</span>
                        {req.guestFieldOfStudy ? ` — ${req.guestFieldOfStudy}` : ''})
                      </div>
                    )}
                    <div>
                      <strong>مدت اقامت ({req.stayDuration}):</strong> ورود{' '}
                      <span className="font-mono">
                        {req.arrivalDate} {req.arrivalTime}
                      </span>{' '}
                      | خروج{' '}
                      <span className="font-mono">
                        {req.departureDate} {req.departureTime}
                      </span>
                    </div>
                  </div>
                </div>

                {req.visitReason && (
                  <div className="text-slate-600 dark:text-slate-300">
                    <strong>توضیحات دانشجو:</strong> {req.visitReason}
                  </div>
                )}

                {/* نمایش تأییدیه تعهدات سه‌گانه دانشجو */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    تعهد مسئولیت کامل اقدامات مهمان
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold inline-flex items-center gap-1">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    پذیرش عدم تعلق غذای سلف
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    تأیید رضایت ساکنین اتاق
                  </span>
                </div>

                {req.status === 'rejected' && req.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-rose-100/80 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 font-bold">
                    علت رد ({req.reviewedBy}): {req.rejectionReason}
                  </div>
                )}

                {req.status === 'approved' && req.supervisorNotes && (
                  <div className="p-2.5 rounded-xl bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
                    <strong>دستورالعمل سرپرستی ({req.reviewedBy}):</strong> {req.supervisorNotes}
                  </div>
                )}

                {/* دکمه‌های اقدام سرپرست */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-slate-400">تاریخ ثبت: {req.createdAt}</span>

                  <div className="flex flex-wrap items-center gap-2">
                    {req.status === 'pending_supervisor' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setApproveTarget(req);
                            setApproveNotes(
                              'با درخواست مهمان موافقت شد. لطفاً جهت تکمیل پذیرش، مدارک شناسایی/دانشجویی را به دفتر سرپرستی تحویل دهید.'
                            );
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>موافقت و اعلام مراجعه به سرپرستی</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTarget(req);
                            setRejectReason('');
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>رد درخواست</span>
                        </button>
                      </>
                    )}

                    {req.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleToggleDocsSubmitted(req)}
                        className={`px-4 py-2 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                          req.documentsSubmittedToSupervisor
                            ? 'bg-teal-700 text-white hover:bg-teal-800'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>
                          {req.documentsSubmittedToSupervisor
                            ? `مدارک تحویل داده شد (${req.documentsSubmittedAt || ''})`
                            : 'ثبت تحویل حضوری مدارک به سرپرستی'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مدال موافقت با درخواست مهمان */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>تأیید و موافقت با درخواست مهمان ({approveTarget.trackingCode})</span>
              </h4>
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 leading-relaxed">
                با تأیید این درخواست، پیام موافقت در کارتابل دانشجو{' '}
                <strong>{approveTarget.studentName}</strong> نمایش داده می‌شود تا جهت تحویل مدارک مهمان{' '}
                <strong>{approveTarget.guestFullName}</strong> به دفتر سرپرستی مراجعه نماید.
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  پیام و دستورالعمل مدارک مورد نیاز برای نمایش به دانشجو
                </label>
                <textarea
                  rows={3}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  ثبت موافقت نهایی
                </button>
                <button
                  type="button"
                  onClick={() => setApproveTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال رد درخواست مهمان */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>رد درخواست مهمان ({rejectTarget.trackingCode})</span>
              </h4>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  علت رد درخواست مهمان (جهت اطلاع دانشجو) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="مثلاً عدم امکان پذیرش مهمان در بازه امتحانات یا مغایرت مدارک..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  تأیید و رد درخواست
                </button>
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
