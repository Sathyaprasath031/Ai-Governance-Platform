import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ClipboardCheck,
  Activity,
  Boxes,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Circle,
  FileText,
  Users,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Lock,
  Eye,
  Info,
} from 'lucide-react';
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

const ROLE_PROFILES = {
  admin: {
    title: 'Administrator',
    badge: 'border-purple-400/30 bg-purple-500/15 text-purple-300',
    icon: ShieldCheck,
    summary: 'Full control over all platform assets, approval workflows, policies, and audit trails.',
    permissions: ['Create & Edit Models', 'Submit Versions', 'Approve/Reject Deployments', 'Full Audit Log Access', 'Policy Override'],
    focus: 'Managing organizational risk thresholds, overseeing compliance, and resolving approval bottlenecks.',
  },
  model_owner: {
    title: 'Model Owner',
    badge: 'border-blue-400/30 bg-blue-500/15 text-blue-300',
    icon: Boxes,
    summary: 'Lead engineer or scientist responsible for model training, metadata documentation, and versioning.',
    permissions: ['Register New Models', 'Upload Version Artifacts', 'Submit Candidates for Review', 'Track Deployment Pipeline'],
    focus: 'Publishing model release candidates, providing detailed changelogs, and satisfying compliance checklists.',
  },
  reviewer: {
    title: 'Reviewer',
    badge: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
    icon: ClipboardCheck,
    summary: 'Designated risk or compliance validator authorized to sign off on production deployments.',
    permissions: ['Inspect Release Candidates', 'Evaluate Bias & Drift Metrics', 'Record Official Approval / Rejection', 'Add Governance Comments'],
    focus: 'Verifying that high and critical risk models meet ethical, regulatory, and validation criteria.',
  },
  auditor: {
    title: 'Auditor',
    badge: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
    icon: Eye,
    summary: 'Compliance or risk officer verifying immutable records, policy adherence, and chain of custody.',
    permissions: ['Full Cryptographic Audit Log', 'Trace Model Lineage', 'Export Verification Proofs', 'Inspect Version History'],
    focus: 'Ensuring audit readiness under EU AI Act, NIST AI RMF, and internal regulatory standards.',
  },
  viewer: {
    title: 'Viewer',
    badge: 'border-slate-400/30 bg-slate-500/15 text-slate-300',
    icon: Info,
    summary: 'Stakeholder with read-only visibility into the inventory, status, and governance metrics.',
    permissions: ['View Model Registry', 'Inspect Risk Classifications', 'Check Approval Queue Status', 'Review Public Metrics'],
    focus: 'Monitoring model readiness and general AI inventory health across the organization.',
  },
};

const ROLE_MATRIX = [
  { role: 'Admin', register: true, submit: true, approve: true, audit: true, manage: true },
  { role: 'Model Owner', register: true, submit: true, approve: false, audit: false, manage: true },
  { role: 'Reviewer', register: false, submit: false, approve: true, audit: false, manage: false },
  { role: 'Auditor', register: false, submit: false, approve: false, audit: true, manage: false },
  { role: 'Viewer', register: false, submit: false, approve: false, audit: false, manage: false },
];

export default function Dashboard() {
  const { user, can } = useAuth();
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

  const currentRole = user?.role ? (ROLE_PROFILES[user.role] || ROLE_PROFILES.viewer) : ROLE_PROFILES.viewer;
  const RoleIcon = currentRole.icon;

  const kpis = [
    { label: 'Models governed', value: total, icon: Boxes, tint: KPI_TINTS.brand, bar: 'bg-brand-400/50' },
    { label: 'In production', value: deployed, icon: Activity, tint: KPI_TINTS.sky, bar: 'bg-sky-400/50' },
    { label: 'Open approvals', value: approvals.length, icon: ClipboardCheck, tint: KPI_TINTS.amber, bar: 'bg-amber-400/50' },
    { label: 'At-risk versions', value: atRisk, icon: ShieldAlert, tint: KPI_TINTS.rose, bar: 'bg-rose-400/50' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="page-title">Governance Overview</h1>
          <p className="page-sub">Lifecycle state, approvals and risk across your AI estate.</p>
        </div>
        {user && (
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-sm">
            <span className="text-xs text-slate-400">Signed in as:</span>
            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${currentRole.badge}`}>
              <RoleIcon size={13} />
              {currentRole.title}
            </span>
          </div>
        )}
      </div>

      {/* Role-Specific Active Workspace Banner */}
      {user && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-brand-950/40 via-white/[0.03] to-fuchsia-950/20 p-5 backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3.5">
              <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${currentRole.badge}`}>
                <RoleIcon size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Your Workspace Role: {currentRole.title}</h2>
                  <span className="text-xs text-slate-400">({user.name})</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-300/90">{currentRole.summary}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-400">Key Focus:</span>
                  <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300">
                    {currentRole.focus}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {can.manage && (
                <Link to="/models" className="btn-primary !py-1.5 !text-xs">
                  <Boxes size={14} /> Register Model
                </Link>
              )}
              {can.review && (
                <Link to="/approvals" className="btn-secondary !py-1.5 !text-xs">
                  <ClipboardCheck size={14} /> Review Queue ({approvals.length})
                </Link>
              )}
              {can.audit && (
                <Link to="/audit" className="btn-secondary !py-1.5 !text-xs">
                  <Activity size={14} /> Audit Trail
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Spacer to push remaining space down */}
      <div className="flex-1" />

      {/* Roles & Access Matrix + Governance Readiness */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* LEFT card: Role & Permissions Matrix */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="card-title text-sm font-semibold text-slate-200">Role & Access Matrix</h3>
            <span className="text-[11px] text-slate-500">RBAC Governance Model</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400">
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 text-center font-medium">Register</th>
                  <th className="py-2 text-center font-medium">Submit</th>
                  <th className="py-2 text-center font-medium">Approve</th>
                  <th className="py-2 text-center font-medium">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {ROLE_MATRIX.map((r) => {
                  const isCurrent = user?.role && r.role.toLowerCase().replace(' ', '_') === user.role;
                  return (
                    <tr key={r.role} className={isCurrent ? 'bg-brand-500/10 font-semibold text-brand-200' : ''}>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span>{r.role}</span>
                          {isCurrent && <span className="rounded bg-brand-400/20 px-1 text-[10px] text-brand-300">you</span>}
                        </div>
                      </td>
                      <td className="py-2.5 text-center">{r.register ? '✅' : '—'}</td>
                      <td className="py-2.5 text-center">{r.submit ? '✅' : '—'}</td>
                      <td className="py-2.5 text-center">{r.approve ? '✅' : '—'}</td>
                      <td className="py-2.5 text-center">{r.audit ? '✅' : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT card: Governance Readiness Checklist */}
        <div className="card p-5">
          <h3 className="card-title mb-4 text-sm font-semibold text-slate-200">Governance Readiness</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-emerald-300/90">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              <span>Risk classification framework active (4 tiers: low to critical)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-emerald-300/90">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              <span>Multi-reviewer approval policies enforced</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-emerald-300/90">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              <span>Immutable cryptographic audit logging enabled</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <Circle size={15} className="shrink-0 text-slate-500" />
              <span>Continuous bias & fair-lending drift monitors configured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function canSeeAudit(user) {
  return user && ['admin', 'auditor'].includes(user.role);
}
