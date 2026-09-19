import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Award, 
  User, 
  Sparkles, 
  FolderGit2, 
  MessageSquare, 
  Layers, 
  RefreshCw,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { TalentAPI } from '../api/client';
import { useTalent } from '../context/TalentContext';

export const ApprovalsView = () => {
  const { currentEnterprise, refreshPendingApprovals, showToast } = useTalent();
  const [approvals, setApprovals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const params = statusFilter === 'all' ? {} : { status: statusFilter };
      const res = await TalentAPI.getApprovals(params);
      setApprovals(res.data.results || []);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleResolve = async (approvalId, decision) => {
    try {
      setResolvingId(approvalId);
      await TalentAPI.resolveApproval(approvalId, {
        status: decision, // 'approved' or 'rejected'
        reviewer_notes: reviewerNote || (decision === 'approved' ? 'Verified by HR Admin.' : 'Declined.')
      });
      showToast(
        decision === 'approved' 
          ? 'Approval confirmed! Skill confidence boosted and badge awarded.' 
          : 'Request marked as rejected.', 
        decision === 'approved' ? 'success' : 'info'
      );
      setReviewerNote('');
      setSelectedApproval(null);
      fetchApprovals();
      refreshPendingApprovals();
    } catch (err) {
      showToast('Error resolving approval request.', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="atlas-surface-elevated p-6 border-l-4 border-l-amber-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
              Continuous Talent Feedback Loop
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight">
            HR Approvals & Evidence Verification
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-600 max-w-2xl mt-1">
            Review self-reported contributions and skill demonstrations. Approving immediately boosts employee skill confidence scores, grants verified badges, and recalculates enterprise role matches.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300">
          {['pending', 'approved', 'rejected', 'all'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {loading ? (
          <div className="atlas-surface-elevated p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Loading approval requests...</span>
          </div>
        ) : approvals.length === 0 ? (
          <div className="atlas-surface-elevated p-12 text-center text-slate-400 text-xs">
            No {statusFilter} approval requests found for {currentEnterprise?.name || 'NovaTech Solutions'}.
          </div>
        ) : (
          approvals.map(req => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';

            return (
              <div
                key={req.id}
                className={`atlas-surface-elevated p-5 space-y-4 border-l-4 transition-all ${
                  isPending 
                    ? 'border-l-amber-500' 
                    : isApproved 
                      ? 'border-l-emerald-500' 
                      : 'border-l-rose-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isPending 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : isApproved 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {req.request_type === 'project_contribution' ? <FolderGit2 className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {req.request_type?.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isPending 
                            ? 'bg-amber-500/20 text-amber-300' 
                            : isApproved 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {req.status?.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white light:text-slate-900 mt-1">
                        {req.title}
                      </h3>

                      <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5 flex items-center gap-2">
                        <span>Submitted by <strong className="text-slate-200 light:text-slate-800">{req.requester_name || 'Employee'}</strong></span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{new Date(req.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolve(req.id, 'approved')}
                        disabled={resolvingId === req.id}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Verify</span>
                      </button>

                      <button
                        onClick={() => handleResolve(req.id, 'rejected')}
                        disabled={resolvingId === req.id}
                        className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Evidence Description */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-white/[0.04] light:border-slate-200 text-xs text-slate-300 light:text-slate-700 leading-relaxed">
                  {req.description}
                </div>

                {/* Feedback Loop Telemetry Badge */}
                {isApproved && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      HR Verified by <strong>{req.reviewer_name || 'HR Admin'}</strong> on {new Date(req.resolved_at || req.created_at).toLocaleDateString()}. Skill confidence boosted & role matches updated.
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
