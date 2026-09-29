import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ClipboardCheck, Activity, Boxes, ArrowUpRight } from 'lucide-react';
import api from '../api';
import { RiskBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const RISK_BAR = {
  critical: 'from-rose-500 to-pink-500',
  high: 'from-orange-400 to-rose-400',
  medium: 'from-amber-300 to-orange-400',
  low: 'from-emerald-400 to-teal-400',
};

const KPI_TINTS = {
  brand: 'from-brand-500/25 to-brand-500/5 text-brand-600 dark:text-brand-300',
  sky: 'from-sky-500/25 to-sky-500/5 text-sky-600 dark:text-sky-300',
  amber: 'from-amber-500/25 to-amber-500/5 text-amber-600 dark:text-amber-300',
  rose: 'from-rose-500/25 to-rose-500/5 text-rose-600 dark:text-rose-300',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [models, setModels] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    api('/models').then((d) => setModels(d.models)).catch(() => {});
    api('/approvals').then((d) => setApprovals(d.approvals)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user && ['admin', 'auditor'].includes(user.role)) {
      api('/audit?limit=6').then((d) => setAudit(d.entries)).catch(() => {});
    }
  }, [user]);

  const total = models.length;
  const deployed = models.filter((m) => m.currentVersion?.status === 'deployed').length;
  const riskCounts = ['critical', 'high', 'medium', 'low'].map((t) => ({
    tier: t,
    n: models.filter((m) => m.riskTier === t).length,
  }));
  const atRisk = models.filter((m) =>
    ['pending_review', 'rejected', 'deprecated'].includes(m.currentVersion?.status)
  ).length;

  const kpis = [
    { label: 'Models governed', value: total, icon: Boxes, tint: KPI_TINTS.brand, bar: 'bg-brand-400/50' },
    { label: 'In production', value: deployed, icon: Activity, tint: KPI_TINTS.sky, bar: 'bg-sky-400/50' },
    { label: 'Open approvals', value: approvals.length, icon: ClipboardCheck, tint: KPI_TINTS.amber, bar: 'bg-amber-400/50' },
    { label: 'At-risk versions', value: atRisk, icon: ShieldAlert, tint: KPI_TINTS.rose, bar: 'bg-rose-400/50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Overview</p>
        <h1 className="page-title">Governance Overview</h1>
        <p className="page-sub">Lifecycle state, approvals and risk across your AI estate.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, tint, bar }) => (
          <div key={label} className="card card-hover group relative overflow-hidden p-4">
            <div className={`absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r ${bar} opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_12px_rgba(139,92,246,0.6)]`} />
            <div className="flex items-center gap-3.5">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br ${tint} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                <Icon size={21} className="transition-transform duration-300 group-hover:scale-110" />
              </span>
              <div>
                <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
                <div className="text-xs font-medium text-slate-400">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Risk distribution */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="card-title mb-4">Models by risk tier</h2>
          <div className="space-y-3.5">
            {riskCounts.map(({ tier, n }) => (
              <div key={tier} className="flex items-center gap-3">
                <div className="w-24 shrink-0"><RiskBadge tier={tier} /></div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${RISK_BAR[tier]} shadow-[0_0_12px_-2px_rgba(139,92,246,0.4)] transition-all duration-500`}
                    style={{ width: `${total ? (n / total) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-200">{n}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending approvals */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="card-title">Pending approvals</h2>
            <Link to="/approvals" className="link-accent inline-flex items-center gap-0.5">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {approvals.length === 0 && <p className="text-sm text-slate-500">Queue is clear ✅</p>}
          <div className="space-y-1.5">
            {approvals.slice(0, 4).map((a) => (
              <Link
                key={a._id}
                to={`/models/${a.model}`}
                className="block rounded-xl border border-transparent p-2.5 transition-colors hover:border-white/10 hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <span className="font-mono text-brand-300">v{a.version?.version}</span>
                  <span className="badge border-rose-400/25 bg-rose-400/10 text-rose-700 dark:text-rose-300">{a.riskTier}</span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {a.approvals.length}/{a.requiredApprovals} approvals · by {a.requestedBy?.name || 'unknown'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {canSeeAudit(user) && (
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="card-title">Recent audit activity</h2>
            <Link to="/audit" className="link-accent inline-flex items-center gap-0.5">
              Full trail <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {audit.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
            {audit.map((e) => (
              <div key={e._id} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/[0.04]">
                <span className="w-full font-mono text-[11px] text-slate-500 sm:w-36 sm:shrink-0">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
                <span className="font-semibold text-slate-200">{e.actorName}</span>
                <span className="text-slate-400">
                  {e.action} — {e.targetLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function canSeeAudit(user) {
  return user && ['admin', 'auditor'].includes(user.role);
}
