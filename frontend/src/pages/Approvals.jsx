import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import api from '../api';
import { RiskBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';

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
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Workflow</p>
        <h1 className="page-title">Approval Queue</h1>
        <p className="page-sub">Versions awaiting reviewer sign-off before deployment.</p>
      </div>

      {!can.review && (
        <div className="alert-warn">Your role ({user?.role}) cannot approve or reject. You can view the queue.</div>
      )}
      {error && <div className="alert-error">{error}</div>}
      {msg && <div className="alert-success">{msg}</div>}

      {approvals.length === 0 && !error && (
        <div className="card grid place-items-center p-10 text-center">
          <div className="text-3xl">🎉</div>
          <p className="mt-2 text-sm text-slate-400">No pending approvals — everything is signed off.</p>
        </div>
      )}

      <div className="space-y-4">
        {approvals.map((a) => (
          <div key={a._id} className="card p-5">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono text-sm font-semibold text-brand-300">
                v{a.version?.version}
              </span>
              <RiskBadge tier={a.riskTier} />
              <span className="text-xs text-slate-500">
                requested by <span className="text-slate-300">{a.requestedBy?.name || 'unknown'}</span> ·{' '}
                <span className="tabular-nums">{a.approvals.length}/{a.requiredApprovals}</span> approvals
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
            {a.version?.changelog && <p className="mb-3 text-sm text-slate-400">{a.version.changelog}</p>}
            {a.approvals.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {a.approvals.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-sm">
                    <span>{d.decision === 'approved' ? '✅' : '❌'}</span>
                    <span className="font-semibold text-slate-200">{d.reviewerName}</span>
                    {d.comment && <span className="text-slate-500">— “{d.comment}”</span>}
                  </div>
                ))}
              </div>
            )}
            {can.review && (
              <input
                className="input"
                placeholder="Review comment (optional)"
                value={comments[a._id] || ''}
                onChange={(e) => setComments({ ...comments, [a._id]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
