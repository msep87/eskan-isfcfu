import React, { useMemo, useState } from 'react';
import {
  SchedProfessor,
  SchedProfessorProposal,
  SchedProfessorProposalStatus,
} from '../types';
import { Storage } from '../utils/storage';
import {
  SCHED_EMPLOYMENT_LABELS,
  formatProfessorDegreeFull,
  getNextTemporaryProfessorCode,
  isTemporaryProfessorCode,
  normalizeProfessorCodeInput,
} from '../utils/schedulingUtils';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  XCircle,
} from 'lucide-react';

interface AdminProfessorProposalsPanelProps {
  reviewerId?: string;
  reviewerName?: string;
  onDataChanged?: (message?: string) => void;
  compactEmpty?: boolean;
}

export const AdminProfessorProposalsPanel: React.FC<AdminProfessorProposalsPanelProps> = ({
  reviewerId = 'admin',
  reviewerName = 'مدیر کل سامانه',
  onDataChanged,
  compactEmpty = false,
}) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | SchedProfessorProposalStatus>('pending');
  const [codeDraftById, setCodeDraftById] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editingCodeProfId, setEditingCodeProfId] = useState<string | null>(null);
  const [golestanCodeDraft, setGolestanCodeDraft] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const proposals = useMemo(
    () => Storage.getSchedProfessorProposals(),
    [refreshTick]
  );
  const professors = useMemo(
    () => Storage.getSchedProfessors(),
    [refreshTick]
  );
  const profMap = useMemo(
    () => new Map<string, SchedProfessor>(professors.map((p) => [p.id, p])),
    [professors]
  );

  const pendingCount = useMemo(
    () => proposals.filter((p) => p.status === 'pending').length,
    [proposals]
  );
  const nextAutoTempCode = useMemo(
    () => getNextTemporaryProfessorCode(professors, proposals) || 'new001',
    [professors, proposals]
  );

  const visibleProposals = useMemo(() => {
    const base =
      filterStatus === 'all'
        ? proposals
        : proposals.filter((p) => p.status === filterStatus);
    return [...base].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [proposals, filterStatus]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  const getSuggestedCodeForProposal = (pr: SchedProfessorProposal): string => {
    if (codeDraftById[pr.id] !== undefined) return codeDraftById[pr.id];
    const proposed = normalizeProfessorCodeInput(pr.proposedProfessorCode);
    const conflict =
      proposed &&
      professors.some(
        (p) => normalizeProfessorCodeInput(p.professorCode).toLowerCase() === proposed.toLowerCase()
      );
    if (proposed && !conflict) return proposed;
    return nextAutoTempCode;
  };

  const handleApprove = (pr: SchedProfessorProposal) => {
    const chosenCode = normalizeProfessorCodeInput(getSuggestedCodeForProposal(pr));
    const res = Storage.approveSchedProfessorProposal({
      proposalId: pr.id,
      reviewerId,
      reviewerName,
      assignedCode: chosenCode || nextAutoTempCode,
    });
    if (!res.success) {
      showToast('error', res.message);
      return;
    }
    setRefreshTick((t) => t + 1);
    showToast('success', res.message);
    onDataChanged?.(res.message);
  };

  const handleReject = (pr: SchedProfessorProposal) => {
    const res = Storage.rejectSchedProfessorProposal({
      proposalId: pr.id,
      reviewerId,
      reviewerName,
      reason: rejectReason.trim() || 'نیاز به بررسی و تکمیل مشخصات استاد',
    });
    if (!res.success) {
      showToast('error', res.message);
      return;
    }
    setRejectingId(null);
    setRejectReason('');
    setRefreshTick((t) => t + 1);
    showToast('success', res.message);
    onDataChanged?.(res.message);
  };

  const handleUpdateGolestanCode = (prof: SchedProfessor) => {
    const clean = normalizeProfessorCodeInput(golestanCodeDraft);
    if (!clean) {
      showToast('error', 'لطفاً کد جدید استاد را وارد کنید.');
      return;
    }
    const res = Storage.updateSchedProfessorAndSync({
      professorId: prof.id,
      updatedFields: { professorCode: clean },
      actorName: reviewerName,
    });
    if (!res.success) {
      showToast('error', res.message);
      return;
    }
    setEditingCodeProfId(null);
    setGolestanCodeDraft('');
    setRefreshTick((t) => t + 1);
    showToast('success', res.message);
    onDataChanged?.(res.message);
  };

  if (compactEmpty && proposals.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                درخواست‌های ثبت استاد جدید از مدیران گروه
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
                  pendingCount > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {pendingCount.toLocaleString('fa-IR')} در انتظار تأیید
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              امکان تأیید با کد موقت <span className="font-mono font-bold">new001</span> تا{' '}
              <span className="font-mono font-bold">new999</span> و اصلاح بعدی به کد مشخصه رسمی سامانه گلستان
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          {(
            [
              { key: 'pending', label: `در انتظار تایید (${pendingCount})` },
              {
                key: 'approved',
                label: `تایید شده (${proposals.filter((p) => p.status === 'approved').length})`,
              },
              {
                key: 'rejected',
                label: `رد شده (${proposals.filter((p) => p.status === 'rejected').length})`,
              },
              { key: 'all', label: `همه (${proposals.length})` },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterStatus(item.key)}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                filterStatus === item.key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {visibleProposals.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          {filterStatus === 'pending'
            ? 'درخواست جدیدی در صف انتظار تأیید مدیر سامانه وجود ندارد.'
            : 'درخواستی در این وضعیت ثبت نشده است.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleProposals.map((pr) => {
            const degreeStr =
              formatProfessorDegreeFull(pr.degreeLevel, pr.degreeField, pr.degreeSpecialization) ||
              pr.degreeFull ||
              '—';
            const linkedProf = pr.approvedProfessorId ? profMap.get(pr.approvedProfessorId) : undefined;
            const activeAssignedCode = linkedProf?.professorCode || pr.assignedProfessorCode || '';
            const hasTempAssigned = isTemporaryProfessorCode(activeAssignedCode);
            const draftCode = getSuggestedCodeForProposal(pr);

            return (
              <div
                key={pr.id}
                className={`p-4 rounded-2xl border text-xs space-y-3 ${
                  pr.status === 'pending'
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/70'
                    : pr.status === 'approved'
                    ? 'bg-emerald-50/35 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/50'
                    : 'bg-rose-50/35 dark:bg-rose-950/15 border-rose-200 dark:border-rose-900/50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {pr.fullName}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]" dir="ltr">
                      کد ملی: {pr.nationalId}
                    </span>
                    {pr.status === 'approved' && activeAssignedCode && (
                      <span
                        className={`px-2.5 py-0.5 rounded-lg font-mono font-black text-[11px] border ${
                          hasTempAssigned
                            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700'
                        }`}
                      >
                        کد استاد: {activeAssignedCode}
                        {hasTempAssigned ? ' (کد موقت)' : ' (کد رسمی)'}
                      </span>
                    )}
                    {linkedProf?.previousTemporaryCode && !hasTempAssigned && (
                      <span className="text-[10.5px] text-slate-500 font-mono">
                        کد موقت قبلی: {linkedProf.previousTemporaryCode}
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold inline-flex items-center gap-1 ${
                      pr.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : pr.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {pr.status === 'pending' ? (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>در انتظار تأیید مدیر سامانه</span>
                      </>
                    ) : pr.status === 'approved' ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>تأیید و ثبت در سامانه</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>رد شده</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">درخواست‌کننده:</span>{' '}
                    <strong>{pr.requestedByName}</strong>
                    {pr.requestedByFields && pr.requestedByFields.length > 0 && (
                      <span className="text-slate-500"> ({pr.requestedByFields.join('، ')})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400">مدرک و رشته:</span> <strong>{degreeStr}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">گروه / مرتبه:</span>{' '}
                    <strong>
                      {pr.departmentName || '—'} · {pr.academicRank || SCHED_EMPLOYMENT_LABELS[pr.employmentType]}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">تماس:</span>{' '}
                    <span className="font-mono font-bold" dir="ltr">
                      {pr.mobile || pr.landlinePhone || '—'}
                    </span>
                  </div>
                </div>

                {(pr.bankName || pr.bankAccount || pr.notes) && (
                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-300 bg-white/75 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    {(pr.bankName || pr.bankAccount) && (
                      <span>
                        حساب بانکی: {pr.bankName || '—'}{' '}
                        <span className="font-mono" dir="ltr">
                          {pr.bankAccount || ''}
                        </span>
                      </span>
                    )}
                    {pr.notes && <span>توضیحات مدیر گروه: {pr.notes}</span>}
                  </div>
                )}

                {pr.status === 'pending' && (
                  <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/50 space-y-2.5">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="space-y-1">
                          <span className="block font-extrabold text-[11px] text-slate-700 dark:text-slate-200">
                            کد استاد هنگام تأیید (موقت new001 تا new999 یا کد گلستان):
                          </span>
                          <input
                            type="text"
                            value={draftCode}
                            onChange={(e) =>
                              setCodeDraftById((prev) => ({
                                ...prev,
                                [pr.id]: e.target.value,
                              }))
                            }
                            placeholder={nextAutoTempCode}
                            className="px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-mono font-black text-xs w-44"
                            dir="ltr"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setCodeDraftById((prev) => ({
                              ...prev,
                              [pr.id]: nextAutoTempCode,
                            }))
                          }
                          className="px-2.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>کد موقت بعدی ({nextAutoTempCode})</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(pr)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>تأیید و افزودن به سامانه</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(rejectingId === pr.id ? null : pr.id);
                            setRejectReason('');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>رد درخواست</span>
                        </button>
                      </div>
                    </div>

                    {rejectingId === pr.id && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="دلیل رد درخواست برای اطلاع مدیر گروه..."
                          className="flex-1 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleReject(pr)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                        >
                          ثبت نهایی رد درخواست
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {pr.status === 'rejected' && pr.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-rose-100/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-[11px] font-bold">
                    دلیل رد: {pr.rejectionReason} ({pr.reviewedByName})
                  </div>
                )}

                {pr.status === 'approved' && linkedProf && hasTempAssigned && (
                  <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-900/50 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold">
                      این استاد با کد موقت «{linkedProf.professorCode}» فعال است. پس از صدور کد در سامانه گلستان می‌توانید آن را جایگزین کنید:
                    </span>
                    {editingCodeProfId === linkedProf.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={golestanCodeDraft}
                          onChange={(e) => setGolestanCodeDraft(e.target.value)}
                          placeholder="کد رسمی گلستان"
                          className="px-2.5 py-1 rounded-lg border border-teal-400 bg-white dark:bg-slate-900 font-mono text-xs w-36"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateGolestanCode(linkedProf)}
                          className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>ثبت و همگام‌سازی</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCodeProfId(null);
                            setGolestanCodeDraft('');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                        >
                          لغو
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCodeProfId(linkedProf.id);
                          setGolestanCodeDraft('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>اصلاح به کد گلستان</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
