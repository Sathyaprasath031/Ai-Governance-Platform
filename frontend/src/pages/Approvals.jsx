import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ShieldCheck, ArrowRight, GitPullRequest, ClipboardCheck, Sparkles } from 'lucide-react';
import api from '../api';
import { RiskBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const WORKFLOW_STEPS = [
  {
    num: 1,
    title: 'Model owner submits version',
    desc: 'Registers a new release candidate with changelog, datasets, and artifacts.',
    icon: GitPullRequest,
  },
  {
    num: 2,
    title: 'Risk tier determines required approvals',
    desc: 'Policy engine evaluates model risk tier to set mandatory reviewer sign-off count.',
    icon: ShieldCheck,
  },
  {
    num: 3,
    title: 'Reviewers evaluate and decide',
    desc: 'Designated risk reviewers inspect evaluation metrics, bias, and approve or reject.',
    icon: CheckCircle2,
  },
  {
    num: 4,
    title: 'Version deployed or sent back',
    desc: 'Approved releases unlock deployment; rejected releases return to draft.',
    icon: ArrowRight,
  },
];

const RISK_REQUIREMENTS = [
  { tier: 'low', req: '1 approval needed' },
  { tier: 'medium', req: '1 approval needed' },
  { tier: 'high', req: '2 approvals needed' },
  { tier: 'critical', req: '2+ approvals needed' },
];

export default function Approvals() {
  const { user, can } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [comments, setComments] = useState({});
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api('/approvals').then((d) => setApprovals(d.approvals)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const decide = async (id, decision) => {
    setError('');
    setMsg('');
    try {
      await api(`/approvals/${id}/decide`, {
        method: 'POST',
        body: JSON.stringify({ decision, comment: comments[id] || '' }),
      });
      setMsg(decision === 'approved' ? 'Approval recorded.' : 'Version rejected.');
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col space-y-6">
      {/* Header */}
      <div>
        <p className="eyebrow">Workflow</p>
        <h1 className="page-title">Approval Queue</h1>
        <p className="page-sub">Release candidates awaiting validator sign-off before production deployment.</p>
      </div>

      {!can.review && (
        <div className="alert-warn">
          Your role ({user?.role?.replace('_', ' ')}) is in read-only mode for this queue. Designated reviewers and administrators can sign off.
        </div>
      )}
      {error && <div className="alert-error">{error}</div>}
      {msg && <div className="alert-success">{msg}</div>}

      {/* Empty State Card */}
      {approvals.length === 0 && !error && (
        <div className="card-glass grid place-items-center p-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
            <ClipboardCheck size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Queue is clear</h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-sm">
            All submitted model candidates have been reviewed and signed off.
          </p>
        </div>
      )}

      {/* Glassmorphic Approvals List */}
      <div className="space-y-4">
        {approvals.map((a) => (
          <div key={a._id} className="card-glass card-hover group p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-brand-200/90 bg-white/70 px-2.5 py-1 font-mono text-sm font-bold text-brand-700 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300 backdrop-blur-sm">
                v{a.version?.version}
              </span>
              <RiskBadge tier={a.riskTier} />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                requested by <span className="font-semibold text-slate-900 dark:text-slate-200">{a.requestedBy?.name || 'unknown'}</span> ·{' '}
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-200">{a.approvals.length}/{a.requiredApprovals}</span> approvals
              </span>
              <div className="flex-1" />
              {can.review && (
                <div className="flex gap-2">
                  <button className="btn-success" onClick={() => decide(a._id, 'approved')}>
                    <CheckCircle2 size={15} /> Approve
                  </button>
                  <button className="btn-danger" onClick={() => decide(a._id, 'rejected')}>
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              )}
            </div>

            {a.version?.changelog && (
              <p className="mb-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {a.version.changelog}
              </p>
            )}

            {/* Existing Approvals Trail inside glass sub-box */}
            {a.approvals.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {a.approvals.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/60 px-3.5 py-2 text-xs backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.03]"
                  >
                    <span>{d.decision === 'approved' ? '✅' : '❌'}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{d.reviewerName}</span>
                    {d.comment && <span className="text-slate-600 dark:text-slate-400">— “{d.comment}”</span>}
                  </div>
                ))}
              </div>
            )}

            {can.review && (
              <input
                className="input"
                placeholder="Review comment (optional feedback recorded in audit log)"
                value={comments[a._id] || ''}
                onChange={(e) => setComments({ ...comments, [a._id]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      {/* Push remaining space down */}
      <div className="flex-1" />

      {/* Bottom 2 Glassmorphic Cards: Workflow Pipeline & Requirements */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* LEFT: Approval Workflow */}
        <div className="card-glass p-5 sm:p-6">
          <h3 className="card-title mb-4 text-sm font-semibold text-slate-900 dark:text-slate-200">
            Approval Workflow Pipeline
          </h3>
          <div className="space-y-0">
            {WORKFLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isLast = idx === WORKFLOW_STEPS.length - 1;
              return (
                <div key={idx} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-fuchsia-600 text-xs font-bold text-white shadow-sm">
                      {step.num}
                    </div>
                    {!isLast && (
                      <div className="my-1 w-px flex-1 border-l border-dashed border-slate-300 dark:border-white/20" />
                    )}
                  </div>
                  <div className={`pt-0.5 ${!isLast ? 'pb-4' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-brand-700 dark:text-brand-300 shrink-0" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{step.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Approval Requirements by Risk */}
        <div className="card-glass p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="card-title mb-4 text-sm font-semibold text-slate-900 dark:text-slate-200">
              Approval Requirements by Risk Tier
            </h3>
            <div className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
              {RISK_REQUIREMENTS.map((r) => (
                <div
                  key={r.tier}
                  className="flex items-center justify-between py-2.5"
                >
                  <RiskBadge tier={r.tier} />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.req}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/80 bg-white/60 p-3.5 text-xs text-slate-600 backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-200">Policy Note:</span> Decisions are final and recorded in the immutable cryptographic audit trail.
          </div>
        </div>
      </div>
    </div>
  );
}
